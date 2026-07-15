import { NextResponse, type NextRequest } from 'next/server'

import { getCartView, addToCart, setCartItemQty } from '@/lib/commerce/cart'

/** Cart read for the slide-out drawer. */
export async function GET() {
  return NextResponse.json(await getCartView())
}

/** Cart mutations: add (increment) / set (absolute qty, 0 = remove). Returns the fresh view. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { action?: string; variantId?: number; qty?: number }
  const variantId = Number(body.variantId)
  if (!variantId) return NextResponse.json({ ok: false, error: 'Missing product.' }, { status: 400 })

  if (body.action === 'set') await setCartItemQty(variantId, Math.max(0, Math.floor(Number(body.qty) || 0)))
  else await addToCart(variantId, Math.max(1, Math.floor(Number(body.qty) || 1)))

  return NextResponse.json({ ok: true, cart: await getCartView() })
}
