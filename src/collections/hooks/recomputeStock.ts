import type { CollectionAfterChangeHook } from 'payload'

const idOf = (rel: unknown): number | null =>
  rel == null ? null : typeof rel === 'object' ? ((rel as { id?: number }).id ?? null) : (rel as number)

/**
 * The ONLY writer of stockLots quantities and variants.availableQty (non-negotiable #4).
 * Recomputes both from the immutable movement ledger after any movement is written.
 *
 * available delta by type: everything is its signed qty EXCEPT `ship` (0 — those units were
 * already removed from `available` when they were reserved; shipping drains `reserved`).
 */
export const recomputeStockFromMovement: CollectionAfterChangeHook = async ({ doc, req }) => {
  const payload = req.payload
  const lotId = idOf(doc.lot)
  const variantId = idOf(doc.variant)
  if (!variantId) return doc

  if (lotId) {
    const { docs: moves } = await payload.find({
      collection: 'stockMovements',
      where: { lot: { equals: lotId } },
      depth: 0,
      limit: 100000,
      req,
    })

    let available = 0
    let reserved = 0
    let damaged = 0
    for (const m of moves) {
      const q = m.qty ?? 0
      available += m.type === 'ship' ? 0 : q
      if (m.type === 'reserve') reserved += Math.abs(q)
      if (m.type === 'release' || m.type === 'ship') reserved -= Math.abs(q)
      if (m.type === 'damage') damaged += Math.abs(q)
    }
    reserved = Math.max(0, reserved)

    const lot = await payload.findByID({ collection: 'stockLots', id: lotId, depth: 0, req })
    let status = lot.status
    if (status !== 'quarantined' && status !== 'expired') {
      status = available <= 0 ? 'depleted' : 'open'
    }

    await payload.update({
      collection: 'stockLots',
      id: lotId,
      data: { qtyAvailable: available, qtyReserved: reserved, qtyDamaged: damaged, status },
      overrideAccess: true,
      req,
      context: { fromMovement: true },
    })
  }

  // variants.availableQty = sellable stock across the variant's non-quarantined/expired lots
  const { docs: lots } = await payload.find({
    collection: 'stockLots',
    where: { variant: { equals: variantId } },
    depth: 0,
    limit: 100000,
    req,
  })
  const availableQty = lots
    .filter((l) => l.status !== 'quarantined' && l.status !== 'expired')
    .reduce((s, l) => s + (l.qtyAvailable ?? 0), 0)

  await payload.update({
    collection: 'variants',
    id: variantId,
    data: { availableQty },
    overrideAccess: true,
    req,
    context: { fromMovement: true },
  })

  return doc
}
