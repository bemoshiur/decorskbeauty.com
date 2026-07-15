import { getPayloadClient } from '@/lib/payload'

export type CustomerOrder = {
  orderNumber: string
  createdAt: string
  grandTotal: number
  codAmount: number
  itemCount: number
  fulfilmentStatus: string
  paymentStatus: string
  items: { title: string; qty: number }[]
}

/**
 * A customer's own orders, by OTP-verified phone (redesign account page). Read through lib with
 * overrideAccess (orders are staff-only on the REST API, #13); only safe, customer-facing fields are
 * returned — never landed cost / margin.
 */
export async function getOrdersByPhone(phone: string, limit = 20): Promise<CustomerOrder[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'orders',
    where: { phone: { equals: phone } },
    sort: '-createdAt',
    limit,
    depth: 0,
    overrideAccess: true,
  })
  return docs.map((o) => ({
    orderNumber: o.orderNumber ?? '',
    createdAt: (o.createdAt as string) ?? '',
    grandTotal: o.grandTotal ?? 0,
    codAmount: o.codAmount ?? 0,
    itemCount: (o.items ?? []).reduce((s, i) => s + (i.qty ?? 0), 0),
    fulfilmentStatus: o.fulfilmentStatus ?? 'pending',
    paymentStatus: o.paymentStatus ?? 'unpaid',
    items: (o.items ?? []).map((i) => ({ title: i.titleSnapshot ?? '', qty: i.qty ?? 0 })),
  }))
}
