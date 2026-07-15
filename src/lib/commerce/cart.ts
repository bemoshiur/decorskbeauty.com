import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

import type { Variant, Product } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { effectivePrice } from './products'

const COOKIE = 'dkb_cart'

export type CartViewItem = {
  variantId: number
  productSlug: string
  title: string
  option: string | null
  unitPrice: number
  qty: number
  lineTotal: number
  isPreOrder: boolean
}
export type CartView = { token: string | null; items: CartViewItem[]; subtotal: number }

const relId = (rel: unknown): number | null =>
  rel == null ? null : typeof rel === 'object' ? ((rel as { id?: number }).id ?? null) : (rel as number)

export async function getCartToken(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null
}

/** Mutation — call only from a server action / route handler (it sets the cart cookie). */
export async function addToCart(variantId: number, qty = 1): Promise<void> {
  const jar = await cookies()
  let token = jar.get(COOKIE)?.value
  if (!token) {
    token = randomUUID()
    jar.set(COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 })
  }
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'carts', where: { token: { equals: token } }, limit: 1, overrideAccess: true })
  const cart = docs[0]

  if (!cart) {
    await payload.create({ collection: 'carts', overrideAccess: true, data: { token, items: [{ variant: variantId, qty }] } })
    return
  }
  const items = (cart.items ?? []).map((i) => ({ variant: relId(i.variant) as number, qty: i.qty ?? 1 }))
  const idx = items.findIndex((i) => i.variant === variantId)
  if (idx >= 0) items[idx].qty += qty
  else items.push({ variant: variantId, qty })
  await payload.update({ collection: 'carts', id: cart.id, data: { items }, overrideAccess: true })
}

/** Set a line's quantity (qty ≤ 0 removes it). Mutation — server action / route handler only. */
export async function setCartItemQty(variantId: number, qty: number): Promise<void> {
  const token = await getCartToken()
  if (!token) return
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'carts', where: { token: { equals: token } }, limit: 1, overrideAccess: true })
  const cart = docs[0]
  if (!cart) return
  const items = (cart.items ?? [])
    .map((i) => ({ variant: relId(i.variant) as number, qty: i.qty ?? 1 }))
    .map((i) => (i.variant === variantId ? { ...i, qty: Math.max(0, Math.floor(qty)) } : i))
    .filter((i) => i.qty > 0)
  await payload.update({ collection: 'carts', id: cart.id, data: { items }, overrideAccess: true })
}

export async function getCartView(): Promise<CartView> {
  const token = await getCartToken()
  if (!token) return { token: null, items: [], subtotal: 0 }
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'carts', where: { token: { equals: token } }, depth: 2, limit: 1, overrideAccess: true })
  const cart = docs[0]
  if (!cart) return { token, items: [], subtotal: 0 }

  const items: CartViewItem[] = []
  for (const it of cart.items ?? []) {
    const v = it.variant && typeof it.variant === 'object' ? (it.variant as Variant) : null
    if (!v) continue
    const product = v.product && typeof v.product === 'object' ? (v.product as Product) : null
    const unitPrice = effectivePrice(v)
    const qty = it.qty ?? 1
    items.push({
      variantId: v.id,
      productSlug: product?.slug ?? '',
      title: product?.title ?? v.sku,
      option: [v.optionSize, v.optionShade, v.optionBundle].filter(Boolean).join(' · ') || null,
      unitPrice,
      qty,
      lineTotal: unitPrice * qty,
      isPreOrder: product?.fulfilmentMode === 'preOrder',
    })
  }
  return { token, items, subtotal: items.reduce((s, i) => s + i.lineTotal, 0) }
}

/** Shape the cart for computeCheckoutTerms. */
export function cartLinesForTerms(view: CartView) {
  return { lines: view.items.map((i) => ({ unitPrice: i.unitPrice, qty: i.qty, isPreOrder: i.isPreOrder })) }
}
