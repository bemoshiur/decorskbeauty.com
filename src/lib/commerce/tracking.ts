import type { Payload } from 'payload'

import type { Order } from '@/payload-types'
import { buildUserData } from '@/lib/integrations/meta/hash'
import { buildCapiEvent, type MetaContent } from '@/lib/integrations/meta/events'

const relId = (rel: unknown): number | null => (rel == null ? null : typeof rel === 'object' ? ((rel as { id?: number }).id ?? null) : (rel as number))
const site = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://decorskbeauty.com'

const contentIds = (order: Order): string[] => (order.items ?? []).map((i) => i.skuSnapshot).filter((s): s is string => Boolean(s))
const contents = (order: Order): MetaContent[] =>
  (order.items ?? []).filter((i) => i.skuSnapshot).map((i) => ({ id: i.skuSnapshot as string, quantity: i.qty ?? 1, item_price: i.unitPriceSnapshot ?? undefined }))

async function enqueue(payload: Payload, event: object, eventName: string, eventId: string) {
  const existing = await payload.find({ collection: 'capiQueue', where: { eventId: { equals: eventId }, eventName: { equals: eventName } }, limit: 1, overrideAccess: true })
  if (existing.docs.length) return // idempotent — event_id also dedups server-side at Meta
  await payload.create({ collection: 'capiQueue', overrideAccess: true, data: { eventName, eventId, payload: event as Record<string, unknown>, status: 'pending', attempts: 0, nextAttemptAt: new Date().toISOString() } })
}

const orderUserData = (order: Order) =>
  buildUserData({
    phone: order.phone,
    email: order.email,
    externalId: relId(order.customer) != null ? String(relId(order.customer)) : undefined,
    fbp: order.attribution?.fbp, // from the DB, not cookies (#8)
    fbc: order.attribution?.fbc,
    clientIp: order.attribution?.clientIp,
    userAgent: order.attribution?.userAgent,
  })

/** Purchase fires at order confirmation (#9, §13.4). event_id = orderNumber (byte-identical to Pixel). */
export async function enqueuePurchase(payload: Payload, orderId: number) {
  const order = (await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })) as Order
  if (!order.orderNumber) return
  const event = buildCapiEvent({
    eventName: 'Purchase',
    eventTimeSec: Math.floor(Date.now() / 1000),
    eventId: order.orderNumber, // #9 / acceptance #20
    eventSourceUrl: `${site()}/checkout`,
    userData: orderUserData(order),
    value: order.grandTotal ?? 0,
    currency: 'BDT',
    contentIds: contentIds(order),
    contents: contents(order),
  })
  await enqueue(payload, event, 'Purchase', order.orderNumber)
}

/** order_delivered fires at delivery with the TRUE value (§13.4). The gap vs Purchase = the RTO rate. */
export async function enqueueOrderDelivered(payload: Payload, orderId: number) {
  const order = (await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })) as Order
  if (!order.orderNumber) return
  const event = buildCapiEvent({
    eventName: 'order_delivered',
    eventTimeSec: Math.floor(Date.now() / 1000),
    eventId: `${order.orderNumber}-delivered`,
    eventSourceUrl: `${site()}/checkout`,
    userData: orderUserData(order),
    value: order.grandTotal ?? 0,
    currency: 'BDT',
    contentIds: contentIds(order),
    contents: contents(order),
  })
  await enqueue(payload, event, 'order_delivered', `${order.orderNumber}-delivered`)
}
