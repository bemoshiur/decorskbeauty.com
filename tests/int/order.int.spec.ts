import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

import { placeOrder } from '@/lib/commerce/placeOrder'

let payload: Payload

const TITLE = 'TEST Order Product'
const SKU = 'TEST-ORD-1'
const PHONES = ['8801700000001', '8801700000002']

async function cleanup() {
  const custs = await payload.find({ collection: 'customers', where: { phone: { in: PHONES } }, limit: 50, depth: 0 })
  for (const c of custs.docs) {
    const orders = await payload.find({ collection: 'orders', where: { customer: { equals: c.id } }, limit: 50, depth: 0 })
    for (const o of orders.docs) {
      const txns = await payload.find({ collection: 'transactions', where: { order: { equals: o.id } }, limit: 50, depth: 0 })
      for (const t of txns.docs) await payload.delete({ collection: 'transactions', id: t.id, overrideAccess: true })
      await payload.delete({ collection: 'orders', id: o.id, overrideAccess: true })
    }
    await payload.delete({ collection: 'customers', id: c.id, overrideAccess: true })
  }
  const products = await payload.find({ collection: 'products', where: { title: { equals: TITLE } }, limit: 20, depth: 0 })
  for (const p of products.docs) {
    const variants = await payload.find({ collection: 'variants', where: { product: { equals: p.id } }, limit: 20, depth: 0 })
    for (const v of variants.docs) {
      const moves = await payload.find({ collection: 'stockMovements', where: { variant: { equals: v.id } }, limit: 200, depth: 0 })
      for (const m of moves.docs) await payload.delete({ collection: 'stockMovements', id: m.id, overrideAccess: true })
      const lots = await payload.find({ collection: 'stockLots', where: { variant: { equals: v.id } }, limit: 50, depth: 0 })
      for (const l of lots.docs) await payload.delete({ collection: 'stockLots', id: l.id, overrideAccess: true })
      await payload.delete({ collection: 'variants', id: v.id, overrideAccess: true })
    }
    await payload.delete({ collection: 'products', id: p.id, overrideAccess: true })
  }
}

describe('Order placement + FEFO reservation (§7, §10.1, #2/#4)', () => {
  let variantId: number

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await cleanup()
    const product = await payload.create({ collection: 'products', data: { title: TITLE, slug: 'test-order-product', _status: 'published' } })
    const variant = await payload.create({ collection: 'variants', data: { product: product.id, sku: SKU, mrp: 500, weightGrams: 100, active: true } })
    variantId = variant.id
    const lot = await payload.create({
      collection: 'stockLots',
      data: { variant: variantId, lotCode: 'TESTORDLOT', expDate: '2028-01-01', qtyReceived: 10, status: 'open' },
      overrideAccess: true,
    })
    // Receipt movement → sets qtyAvailable via the hook.
    await payload.create({ collection: 'stockMovements', data: { lot: lot.id, variant: variantId, qty: 10, type: 'receipt' }, overrideAccess: true })
  }, 60000)

  afterAll(async () => cleanup())

  it('places a COD order, reserves stock and sets codAmount = grandTotal', async () => {
    const { order, payment } = await placeOrder({
      lines: [{ variantId, qty: 2 }],
      zone: 'dhakaCity',
      customer: { name: 'Test Buyer', phone: PHONES[0], address: 'Road 7, Banani' },
      paymentChoice: 'cod',
    })
    expect(order.orderNumber).toMatch(/^DKB-\d{4}-\d{5}$/)
    expect(payment.required).toBe(false)
    expect(order.grandTotal).toBe(2 * 500 + 80) // 1080
    expect(order.codAmount).toBe(1080) // full COD (#2)
    expect(order.fulfilmentStatus).toBe('confirmed')
    expect(order.items?.[0]?.skuSnapshot).toBe(SKU)
    expect(order.items?.[0]?.lotAllocations?.[0]?.qty).toBe(2)

    // Reservation dropped availableQty ONLY through the movement (#4).
    const v = await payload.findByID({ collection: 'variants', id: variantId })
    expect(v.availableQty).toBe(8)
  })

  it('outside orders require a ৳200 advance via EPS and stay pending', async () => {
    const { order, payment } = await placeOrder({
      lines: [{ variantId, qty: 1 }],
      zone: 'outside',
      customer: { name: 'Test Buyer 2', phone: PHONES[1], address: 'Rajshahi' },
      paymentChoice: 'cod',
    })
    // 500 + 140 delivery = 640 grand; outside flat advance 200; cod 440
    expect(order.grandTotal).toBe(640)
    expect(order.advanceRequired).toBe(200)
    expect(order.codAmount).toBe(440)
    expect(order.paymentMethod).toBe('epsAdvance')
    expect(order.fulfilmentStatus).toBe('pending')
    expect(payment.required).toBe(true)
    expect(payment.merchantTransactionId).toBeTruthy()

    const txns = await payload.find({ collection: 'transactions', where: { merchantTransactionId: { equals: payment.merchantTransactionId } }, overrideAccess: true })
    expect(txns.docs[0]?.status).toBe('pending')
    expect(txns.docs[0]?.amount).toBe(200)
  })
})
