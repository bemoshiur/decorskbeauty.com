import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Assign DKB-YYMM-##### server-side, sequential per month (§4.3). orderNumber is unique-indexed;
 * a rare race loses to the unique constraint (retry at the caller). Real high-concurrency would
 * use a DB sequence — fine at this scale.
 */
export const assignOrderNumber: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || data.orderNumber) return data
  const now = new Date()
  const yymm = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`
  const prefix = `DKB-${yymm}-`

  const { docs } = await req.payload.find({
    collection: 'orders',
    where: { orderNumber: { like: prefix } },
    sort: '-orderNumber',
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  let seq = 1
  const last = docs[0]?.orderNumber
  if (typeof last === 'string' && last.startsWith(prefix)) {
    const n = Number(last.slice(prefix.length))
    if (Number.isFinite(n)) seq = n + 1
  }
  data.orderNumber = `${prefix}${String(seq).padStart(5, '0')}`
  return data
}
