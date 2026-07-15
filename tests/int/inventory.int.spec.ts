import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

let payload: Payload

const SKU = 'TEST-INV-001'
const PO = 'TEST-PO-INV'
const TITLE = 'TEST Inventory Product'

async function cleanup() {
  // POs first — their lines reference the variant with a NOT NULL fk.
  const pos = await payload.find({ collection: 'purchaseOrders', where: { poNumber: { equals: PO } }, limit: 100, depth: 0 })
  for (const po of pos.docs) await payload.delete({ collection: 'purchaseOrders', id: po.id })

  const products = await payload.find({ collection: 'products', where: { title: { equals: TITLE } }, limit: 100, depth: 0 })
  for (const p of products.docs) {
    const variants = await payload.find({ collection: 'variants', where: { product: { equals: p.id } }, limit: 100, depth: 0 })
    for (const v of variants.docs) {
      const lots = await payload.find({ collection: 'stockLots', where: { variant: { equals: v.id } }, limit: 100, depth: 0 })
      const moves = await payload.find({ collection: 'stockMovements', where: { variant: { equals: v.id } }, limit: 100, depth: 0 })
      for (const m of moves.docs) await payload.delete({ collection: 'stockMovements', id: m.id, overrideAccess: true })
      for (const l of lots.docs) await payload.delete({ collection: 'stockLots', id: l.id })
      await payload.delete({ collection: 'variants', id: v.id })
    }
    await payload.delete({ collection: 'products', id: p.id })
  }
}

describe('PO receive → landed cost → lots → movements (§4.2, §10)', () => {
  let variantId: number
  let poId: number

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await cleanup()
    const product = await payload.create({ collection: 'products', data: { title: TITLE, slug: 'test-inventory-product', _status: 'published' } })
    const variant = await payload.create({
      collection: 'variants',
      data: { product: product.id, sku: SKU, mrp: 999, weightGrams: 100, active: true },
    })
    variantId = variant.id
    const po = await payload.create({
      collection: 'purchaseOrders',
      data: {
        poNumber: PO,
        currency: 'KRW',
        fxRate: 0.085,
        allocationBasis: 'byValue',
        freightBDT: 1000,
        status: 'draft',
        lines: [
          { variant: variantId, qty: 20, unitCostForeign: 1000, lotCode: 'TESTLOT1', mfgDate: '2026-01-01', expDate: '2028-01-01' },
        ],
      },
    })
    poId = po.id
    // Trigger the receive.
    await payload.update({ collection: 'purchaseOrders', id: poId, data: { status: 'received' } })
  })

  afterAll(async () => {
    await cleanup()
  })

  it('creates a stock lot with the correct landed cost', async () => {
    const lots = await payload.find({ collection: 'stockLots', where: { variant: { equals: variantId } }, limit: 10, depth: 0 })
    expect(lots.docs).toHaveLength(1)
    // (20*1000*0.085 + 1000) / 20 = (1700 + 1000) / 20 = 135
    expect(lots.docs[0].landedCostPerUnit).toBe(135)
    expect(lots.docs[0].lotCode).toBe('TESTLOT1')
    expect(lots.docs[0].qtyReceived).toBe(20)
  })

  it('writes a receipt movement and sets qtyAvailable through it (#4)', async () => {
    const moves = await payload.find({ collection: 'stockMovements', where: { variant: { equals: variantId } }, limit: 10, depth: 0 })
    expect(moves.docs).toHaveLength(1)
    expect(moves.docs[0].type).toBe('receipt')
    expect(moves.docs[0].qty).toBe(20)

    const lots = await payload.find({ collection: 'stockLots', where: { variant: { equals: variantId } }, limit: 10, depth: 0 })
    expect(lots.docs[0].qtyAvailable).toBe(20)

    const variant = await payload.findByID({ collection: 'variants', id: variantId })
    expect(variant.availableQty).toBe(20)
  })

  it('is idempotent — re-saving a received PO creates no duplicate lots', async () => {
    await payload.update({ collection: 'purchaseOrders', id: poId, data: { status: 'received' } })
    const lots = await payload.find({ collection: 'stockLots', where: { variant: { equals: variantId } }, limit: 10, depth: 0 })
    expect(lots.docs).toHaveLength(1)
  })
})
