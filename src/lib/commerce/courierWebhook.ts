import type { Payload } from 'payload'

import { markDelivered, markReturned } from './fulfilment'

export type CourierStatus = 'delivered' | 'returned' | 'inTransit' | 'other'

export function normalizeCourierStatus(raw: string | undefined | null): CourierStatus {
  const s = (raw ?? '').toLowerCase()
  if (s.includes('deliver') && !s.includes('fail') && !s.includes('undeliver')) return 'delivered'
  if (s.includes('return') || s.includes('rto') || s.includes('cancel')) return 'returned'
  if (s.includes('transit') || s.includes('picked') || s.includes('hold') || s.includes('pending')) return 'inTransit'
  return 'other'
}

/**
 * Apply a courier status update to an order (§9.4). Scoped to the calling courier (no cross-courier
 * forgery) and terminal transitions require a shipped pre-state + a consignment id. Idempotent.
 */
export async function applyCourierStatus(payload: Payload, orderNumber: string, rawStatus: string, callingProvider: 'pathao' | 'steadfast') {
  const { docs } = await payload.find({ collection: 'orders', where: { orderNumber: { equals: orderNumber } }, limit: 1, depth: 0, overrideAccess: true })
  const order = docs[0]
  if (!order) return { ok: false as const, reason: 'order not found' }

  // Only the courier that actually shipped this order may move it.
  if (order.courier?.provider && order.courier.provider !== callingProvider) {
    return { ok: false as const, reason: 'provider mismatch' }
  }
  const shipped = (order.fulfilmentStatus === 'handedToCourier' || order.fulfilmentStatus === 'inTransit') && Boolean(order.courier?.consignmentId)

  const status = normalizeCourierStatus(rawStatus)
  if (status === 'delivered') {
    if (!shipped) return { ok: false as const, reason: 'not shipped' }
    await markDelivered(payload, order.id)
  } else if (status === 'returned') {
    if (!shipped) return { ok: false as const, reason: 'not shipped' }
    await markReturned(payload, order.id, 'rto')
  } else if (status === 'inTransit' && order.fulfilmentStatus === 'handedToCourier') {
    await payload.update({ collection: 'orders', id: order.id, data: { fulfilmentStatus: 'inTransit' }, overrideAccess: true })
  }
  return { ok: true as const, status }
}
