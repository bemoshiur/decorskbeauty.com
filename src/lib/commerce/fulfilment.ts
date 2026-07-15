import type { Payload } from 'payload'
import type { Order } from '@/payload-types'

import { round2 } from '@/lib/inventory/landedCost'
import { postJournal, postSaleRevenue, postSaleCogs, postCustomerReturnRefund } from '@/lib/accounting'
import { vatOnSubtotal } from '@/lib/accounting/vat'
import { enqueueOrderDelivered } from './tracking'

const relId = (rel: unknown): number | null =>
  rel == null ? null : typeof rel === 'object' ? ((rel as { id?: number }).id ?? null) : (rel as number)

const now = () => new Date().toISOString()

/** COGS = Σ snapshot landed cost across every allocated lot (§4.3). Pre-order lines with no
 *  allocation contribute 0 until pre-order stock allocation is built. */
const orderCogs = (order: Order): number =>
  round2(
    (order.items ?? []).reduce(
      (s, it) => s + (it.lotAllocations ?? []).reduce((ls, a) => ls + (a.landedCostSnapshot ?? 0) * (a.qty ?? 0), 0),
      0,
    ),
  )

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

/** Delivered (§9.4): increment deliveredCount + LTV, recognize the sale + COGS (delivery-time, #5/#6), fire order_delivered. */
export async function markDelivered(payload: Payload, orderId: number) {
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })
  if (order.fulfilmentStatus === 'delivered') return // idempotent
  // Only a shipped order can be delivered — never a returned/cancelled/pending one.
  if (order.fulfilmentStatus !== 'handedToCourier' && order.fulfilmentStatus !== 'inTransit') return
  // Post the ledger FIRST, while fulfilmentStatus still gates re-entry (idempotent per (order,ref)).
  // If this throws, the order stays handedToCourier so the next webhook/cron retry re-posts — the
  // status flip below must not close the idempotency gate before the money is durably recorded (#5).
  await postDeliveredSale(payload, order as Order) // recognize revenue + COGS at delivery (#5/#6)
  await payload.update({
    collection: 'orders',
    id: orderId,
    overrideAccess: true,
    data: { fulfilmentStatus: 'delivered', paymentStatus: order.paymentMethod === 'cod' ? 'paid' : order.paymentStatus, timeline: [...(order.timeline ?? []), { at: now(), actor: 'courier', event: 'delivered' }] },
  })
  await bumpCustomer(payload, order.customer, (c) => ({ deliveredCount: c.deliveredCount + 1, lifetimeValue: c.lifetimeValue + (order.grandTotal ?? 0) }))
  await enqueueOrderDelivered(payload, orderId) // true-value event; gap vs Purchase = RTO rate (§13.4)
}

/**
 * Recognize the sale at delivery (owner's call, [[revenue-recognition-delivered]]): a revenue entry
 * (release 2030 advance + book 1040 COD receivable → 4010/4020/2020) and a COGS entry (5010 ← 1050).
 * Both balanced + idempotent per (order, ref). codReceivable is derived as grandTotal − advancePaid,
 * NOT order.codAmount (which is stale for an epsFull ready-prepay order).
 */
async function postDeliveredSale(payload: Payload, order: Order) {
  const orderId = order.id
  const orderRef = order.orderNumber ?? String(orderId)
  const subtotal = round2(order.subtotal ?? 0)
  const deliveryCharge = round2(order.deliveryCharge ?? 0)
  const advanceApplied = round2(order.advancePaid ?? 0)
  const codReceivable = round2((order.grandTotal ?? 0) - advanceApplied)
  const discount = round2(order.discountTotal ?? 0)
  const vat = await vatOnSubtotal(payload, subtotal)

  await postJournal(payload, {
    source: 'order',
    sourceId: String(orderId),
    ref: 'sale',
    memo: `Sale recognized on delivery — order ${orderRef}`,
    lines: postSaleRevenue({ subtotal, deliveryCharge, vat, discount, advanceApplied, codReceivable, orderRef }),
  })

  const cogs = orderCogs(order)
  if (cogs > 0) {
    await postJournal(payload, {
      source: 'order',
      sourceId: String(orderId),
      ref: 'cogs',
      memo: `COGS on delivery — order ${orderRef}`,
      lines: postSaleCogs({ cogs, orderRef }),
    })
  }
}

/** Returned / RTO (§9.4): restock to the ORIGINAL lots at original landed cost (#12), bump cancelledCount. */
export async function markReturned(payload: Payload, orderId: number, type: 'rto' | 'customerReturn' = 'rto') {
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })
  if (order.fulfilmentStatus === 'returned') return // idempotent

  const from = order.fulfilmentStatus
  // Valid FROM states: RTO comes from a shipped-but-undelivered order; a customer return from delivered.
  if (type === 'rto' && from !== 'handedToCourier' && from !== 'inTransit') return
  if (type === 'customerReturn' && from !== 'delivered') return

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
  await payload.update({
    collection: 'orders',
    id: orderId,
    data: { fulfilmentStatus: 'returned', paymentStatus: from === 'delivered' ? 'refunded' : order.paymentStatus, timeline: [...(order.timeline ?? []), { at: now(), actor: 'courier', event: 'returned', note: type }] },
    overrideAccess: true,
  })
  // RTO (never delivered) → cancelledCount. Customer return (was delivered) → undo the delivered counters.
  if (from === 'delivered') {
    await bumpCustomer(payload, order.customer, (c) => ({ deliveredCount: Math.max(0, c.deliveredCount - 1), lifetimeValue: Math.max(0, c.lifetimeValue - (order.grandTotal ?? 0)) }))
  } else {
    await bumpCustomer(payload, order.customer, (c) => ({ cancelledCount: c.cancelledCount + 1 }))
  }

  // Reverse the sale — only when a sale was recognized. Under delivery-time recognition an in-transit
  // RTO booked nothing, so it reverses nothing (#5); a post-delivery customer return reverses it (§12.3).
  if (from === 'delivered') {
    const o = order as Order
    const grandTotal = round2(o.grandTotal ?? 0)
    const cogs = orderCogs(o)
    await postJournal(payload, {
      source: 'order',
      sourceId: String(orderId),
      ref: 'customer-return',
      memo: `Customer return refunded — order ${o.orderNumber ?? orderId}`,
      lines: postCustomerReturnRefund({ returnsAmount: grandTotal, bankRefund: grandTotal, cogs, orderRef: o.orderNumber ?? String(orderId) }),
    })
  }
}
