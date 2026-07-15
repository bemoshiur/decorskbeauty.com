import { NextResponse, type NextRequest } from 'next/server'

import { getPayloadClient } from '@/lib/payload'
import { verifyResumeToken } from '@/lib/browser/resumeToken'
import { initPayment } from '@/lib/integrations/eps/client'

/**
 * Resume-and-pay (§13.5). Rehydrates the order draft from the resume token + DB — NEVER cookies —
 * then initialises EPS. This is what /checkout/pay/[token] posts to from a cold, escaped browser.
 */
export async function POST(req: NextRequest) {
  const { token } = (await req.json().catch(() => ({}))) as { token?: string }
  const rt = verifyResumeToken(token)
  if (!rt?.orderId || !rt.mtxn) {
    return NextResponse.json({ ok: false, error: 'This payment link has expired. Start over from your cart.' }, { status: 400 })
  }

  const payload = await getPayloadClient()
  const order = await payload.findByID({ collection: 'orders', id: rt.orderId, depth: 0, overrideAccess: true }).catch(() => null)
  const { docs } = await payload.find({ collection: 'transactions', where: { merchantTransactionId: { equals: rt.mtxn } }, limit: 1, overrideAccess: true })
  const txn = docs[0]
  if (!order || !txn) return NextResponse.json({ ok: false, error: 'Order not found.' }, { status: 404 })
  if (txn.status === 'success') {
    return NextResponse.json({ ok: true, redirect: `/checkout/result?status=success&order=${encodeURIComponent(order.orderNumber ?? '')}` })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  try {
    const { redirectUrl } = await initPayment({
      orderId: order.orderNumber ?? String(order.id),
      amount: txn.amount ?? 0,
      merchantTransactionId: rt.mtxn,
      customer: {
        name: order.shipping?.name ?? 'Customer',
        email: order.email ?? 'guest@decorskbeauty.com',
        phone: order.phone ?? '',
        address: order.shipping?.address ?? '',
        city: 'Dhaka',
        state: 'Dhaka',
        postcode: '1212',
      },
      ipAddress: ip || '0.0.0.0',
      productSummary: `Decor's K-Beauty order ${order.orderNumber}`,
      valueA: order.orderNumber ?? '',
    })
    return NextResponse.json({ ok: true, redirectUrl })
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Payment could not be started.', detail: err instanceof Error ? err.message : undefined }, { status: 502 })
  }
}
