import type { Payload } from 'payload'

const relId = (rel: unknown): number | null =>
  rel == null ? null : typeof rel === 'object' ? ((rel as { id?: number }).id ?? null) : (rel as number)

const now = () => new Date().toISOString()

async function bumpCustomer(payload: Payload, customerRel: unknown, patch: (c: Record<string, number>) => Record<string, unknown>) {
  const id = relId(customerRel)
  if (!id) return
  const c = await payload.findByID({ collection: 'customers', id, overrideAccess: true })
  await payload.update({
    collection: 'customers',
    id,
    overrideAccess: true,
    data: patch({ orderCount: c.orderCount ?? 0, deliveredCount: c.deliveredCount ?? 0, cancelledCount: c.cancelledCount ?? 0, lifetimeValue: c.lifetimeValue ?? 0 }),
  })
}

/** Handed to courier: ship the reserved allocations (reserved → shipped). */
export async function markHandedToCourier(payload: Payload, orderId: number) {
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })
  if (order.fulfilmentStatus === 'handedToCourier' || order.fulfilmentStatus === 'delivered') return
  for (const item of order.items ?? []) {
    const variantId = relId(item.variant)
    for (const a of item.lotAllocations ?? []) {
      const lotId = relId(a.lot)
      if (lotId && variantId && a.qty) {
        await payload.create({ collection: 'stockMovements', overrideAccess: true, data: { lot: lotId, variant: variantId, qty: -a.qty, type: 'ship', refType: 'order', refId: String(orderId), at: now() } })
      }
    }
  }
  await payload.update({ collection: 'orders', id: orderId, data: { fulfilmentStatus: 'handedToCourier', timeline: [...(order.timeline ?? []), { at: now(), actor: 'courier', event: 'handedToCourier' }] }, overrideAccess: true })
}

/** Delivered (§9.4): increment deliveredCount + LTV. order_delivered event → Phase 6, journal → Phase 7. */
export async function markDelivered(payload: Payload, orderId: number) {
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })
  if (order.fulfilmentStatus === 'delivered') return // idempotent
  await payload.update({
    collection: 'orders',
    id: orderId,
    overrideAccess: true,
    data: { fulfilmentStatus: 'delivered', paymentStatus: order.paymentMethod === 'cod' ? 'paid' : order.paymentStatus, timeline: [...(order.timeline ?? []), { at: now(), actor: 'courier', event: 'delivered' }] },
  })
  await bumpCustomer(payload, order.customer, (c) => ({ deliveredCount: c.deliveredCount + 1, lifetimeValue: c.lifetimeValue + (order.grandTotal ?? 0) }))
}

/** Returned / RTO (§9.4): restock to the ORIGINAL lots at original landed cost (#12), bump cancelledCount. */
export async function markReturned(payload: Payload, orderId: number, type: 'rto' | 'customerReturn' = 'rto') {
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })
  if (order.fulfilmentStatus === 'returned') return // idempotent

  const returnItems: { variant: number; qty: number; condition: 'resellable' }[] = []
  for (const item of order.items ?? []) {
    const variantId = relId(item.variant)
    for (const a of item.lotAllocations ?? []) {
      const lotId = relId(a.lot)
      if (lotId && variantId && a.qty) {
        await payload.create({ collection: 'stockMovements', overrideAccess: true, data: { lot: lotId, variant: variantId, qty: a.qty, type: 'returnRestock', refType: 'return', refId: String(orderId), at: now() } })
        returnItems.push({ variant: variantId, qty: a.qty, condition: 'resellable' })
      }
    }
  }
  await payload.create({ collection: 'returns', overrideAccess: true, data: { order: orderId, type, items: returnItems, condition: 'resellable', status: 'processed' } })
  await payload.update({ collection: 'orders', id: orderId, data: { fulfilmentStatus: 'returned', timeline: [...(order.timeline ?? []), { at: now(), actor: 'courier', event: 'returned', note: type }] }, overrideAccess: true })
  await bumpCustomer(payload, order.customer, (c) => ({ cancelledCount: c.cancelledCount + 1 }))
  // Reverse the sale journal → Phase 7.
}
