import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

import { verifyPhoneToken } from '@/lib/auth/otpToken'
import { getCartView } from '@/lib/commerce/cart'
import { placeOrder } from '@/lib/commerce/placeOrder'
import { initPayment } from '@/lib/integrations/eps/client'
import { isInAppBrowser, androidChromeIntent, iosSafariUrl } from '@/lib/browser/inApp'
import { signResumeToken } from '@/lib/browser/resumeToken'

const ZONES = ['dhakaCity', 'dhakaSub', 'outside']

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string
    address?: string
    zone?: string
    landmark?: string
    email?: string
    paymentChoice?: string
  }

  // Guest checkout: phone comes from the OTP-verified cookie, never the client (§17.1).
  const verified = verifyPhoneToken((await cookies()).get('dkb_phone')?.value)
  if (!verified) return NextResponse.json({ ok: false, error: 'Verify your phone first.' }, { status: 401 })

  if (!body.name || !body.address || !body.zone || !ZONES.includes(body.zone)) {
    return NextResponse.json({ ok: false, error: 'Please fill in your name, address and delivery area.' }, { status: 400 })
  }

  const cart = await getCartView()
  if (!cart.items.length) return NextResponse.json({ ok: false, error: 'Your cart is empty.' }, { status: 400 })

  const ua = req.headers.get('user-agent')
  const inApp = isInAppBrowser(ua)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()

  let placed
  try {
    placed = await placeOrder({
      lines: cart.items.map((i) => ({ variantId: i.variantId, qty: i.qty })),
      zone: body.zone as 'dhakaCity' | 'dhakaSub' | 'outside',
      customer: { name: body.name, phone: verified.phone, email: body.email, address: body.address, landmark: body.landmark },
      paymentChoice: body.paymentChoice === 'prepay' ? 'prepay' : 'cod',
      channel: 'web',
      ipAddress: ip,
      inAppBrowser: inApp,
      attribution: { clientIp: ip, userAgent: ua ?? undefined },
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'Could not place order.' }, { status: 400 })
  }

  const orderNumber = placed.order.orderNumber ?? ''

  // COD (or no advance due): order is already confirmed.
  if (!placed.payment.required) {
    return NextResponse.json({ ok: true, orderNumber, redirect: `/checkout/result?status=success&order=${encodeURIComponent(orderNumber)}` })
  }

  // EPS required. Inside the FB webview the redirect chain breaks (§13.5) — hand back an
  // interstitial with intent:// / x-safari links to /checkout/pay/[resumeToken] instead.
  const mtxn = placed.payment.merchantTransactionId!
  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin
  if (inApp) {
    const payUrl = `${origin}/checkout/pay/${signResumeToken({ orderId: placed.order.id, mtxn })}`
    return NextResponse.json({ ok: true, interstitial: true, payUrl, android: androidChromeIntent(payUrl), ios: iosSafariUrl(payUrl) })
  }

  // Normal browser → initialize EPS and hand back the hosted-checkout URL.
  try {
    const { redirectUrl } = await initPayment({
      orderId: orderNumber,
      amount: placed.payment.amount,
      merchantTransactionId: mtxn,
      customer: { name: body.name, email: body.email || 'guest@decorskbeauty.com', phone: verified.phone, address: body.address, city: 'Dhaka', state: 'Dhaka', postcode: '1212' },
      ipAddress: ip || '0.0.0.0',
      productSummary: `Decor's K-Beauty order ${orderNumber}`,
      valueA: orderNumber,
    })
    return NextResponse.json({ ok: true, redirectUrl })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'Payment could not be started. Please try again.', detail: err instanceof Error ? err.message : undefined },
      { status: 502 },
    )
  }
}
