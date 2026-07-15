import type { Payload } from 'payload'

const relId = (rel: unknown): number | null =>
  rel == null ? null : typeof rel === 'object' ? ((rel as { id?: number }).id ?? null) : (rel as number)

/**
 * Cancel orders stuck in `pending` (EPS required but never verified — success moves them to
 * `confirmed`) created before `cutoffIso`, and return their reserved stock (#4, acceptance #11).
 * Retires any still-pending transaction. Idempotent per order via releaseOrderReservations.
 */
export async function cancelStaleOrders(payload: Payload, cutoffIso: string, limit = 500): Promise<{ scanned: number; released: number }> {
  const { docs } = await payload.find({
    collection: 'orders',
    where: { and: [{ fulfilmentStatus: { equals: 'pending' } }, { createdAt: { less_than: cutoffIso } }] },
    limit,
    depth: 0,
    overrideAccess: true,
  })
  let released = 0
  for (const order of docs) {
    if (await releaseOrderReservations(payload, order.id)) released++
    await payload.update({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
      data: {
        fulfilmentStatus: 'cancelled',
        timeline: [...(order.timeline ?? []), { at: new Date().toISOString(), actor: 'system', event: 'cancelled', note: 'abandoned — no payment' }],
      },
    })
    const txns = await payload.find({ collection: 'transactions', where: { and: [{ order: { equals: order.id } }, { status: { equals: 'pending' } }] }, limit: 20, overrideAccess: true })
    for (const t of txns.docs) await payload.update({ collection: 'transactions', id: t.id, overrideAccess: true, data: { status: 'cancelled' } })
  }
  return { scanned: docs.length, released }
}

/**
 * Return an order's reserved units to available via `release` movements (#4 — never write qtyAvailable
 * directly). Idempotent: no-ops if a release already exists for this order, so an EPS cancel and the
 * abandoned-order cron can't double-release. Shared by epsCallback (fail/cancel) and the stale-order cron.
 */
export async function releaseOrderReservations(payload: Payload, orderId: number): Promise<boolean> {
  const already = await payload.find({
    collection: 'stockMovements',
    where: { refType: { equals: 'order' }, refId: { equals: String(orderId) }, type: { equals: 'release' } },
    limit: 1,
    overrideAccess: true,
  })
  if (already.docs.length) return false // already released

  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })
  let released = false
  for (const item of order.items ?? []) {
    const variantId = relId(item.variant)
    for (const alloc of item.lotAllocations ?? []) {
      const lotId = relId(alloc.lot)
      if (lotId && variantId && alloc.qty) {
        await payload.create({
          collection: 'stockMovements',
          overrideAccess: true,
          data: { lot: lotId, variant: variantId, qty: alloc.qty, type: 'release', refType: 'order', refId: String(orderId), at: new Date().toISOString() },
        })
        released = true
      }
    }
  }
  return released
}
