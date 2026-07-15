import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

import type { User } from '@/payload-types'
import { placeOrder } from '@/lib/commerce/placeOrder'
import { cancelStaleOrders } from '@/lib/commerce/stock'
import { runExpiryScan } from '@/lib/inventory/expiry'
import { ensureAccounts } from '@/lib/accounting'

let payload: Payload

const TITLE = 'TEST Hardening Product'
const SLUG = 'test-hardening-product'
const SKU = 'TEST-HARD-1'
const PHONES = ['8801720000001']
const OWNER = 'owner-hardening@dkb.test'
const PACKER = 'packer-hardening@dkb.test'

async function cleanup() {
  for (const email of [OWNER, PACKER]) {
    const u = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, overrideAccess: true })
    for (const d of u.docs) await payload.delete({ collection: 'users', id: d.id, overrideAccess: true })
  }
  const custs = await payload.find({ collection: 'customers', where: { phone: { in: PHONES } }, limit: 50, depth: 0, overrideAccess: true })
  for (const c of custs.docs) {
    const orders = await payload.find({ collection: 'orders', where: { customer: { equals: c.id } }, limit: 50, depth: 0, overrideAccess: true })
    for (const o of orders.docs) {
      const txns = await payload.find({ collection: 'transactions', where: { order: { equals: o.id } }, limit: 50, overrideAccess: true })
      for (const t of txns.docs) await payload.delete({ collection: 'transactions', id: t.id, overrideAccess: true })
      await payload.delete({ collection: 'orders', id: o.id, overrideAccess: true })
    }
    await payload.delete({ collection: 'customers', id: c.id, overrideAccess: true })
  }
  const products = await payload.find({ collection: 'products', where: { slug: { equals: SLUG } }, limit: 20, depth: 0, overrideAccess: true })
  for (const p of products.docs) {
    const variants = await payload.find({ collection: 'variants', where: { product: { equals: p.id } }, limit: 20, depth: 0, overrideAccess: true })
    for (const v of variants.docs) {
      const moves = await payload.find({ collection: 'stockMovements', where: { variant: { equals: v.id } }, limit: 500, overrideAccess: true })
      for (const m of moves.docs) await payload.delete({ collection: 'stockMovements', id: m.id, overrideAccess: true })
      const lots = await payload.find({ collection: 'stockLots', where: { variant: { equals: v.id } }, limit: 50, overrideAccess: true })
      for (const l of lots.docs) {
        const entries = await payload.find({ collection: 'journalEntries', where: { sourceId: { equals: `lot-${l.id}` } }, limit: 20, overrideAccess: true })
        for (const e of entries.docs) {
          if (e.status === 'posted') await payload.update({ collection: 'journalEntries', id: e.id, data: { status: 'void' }, overrideAccess: true })
          const lines = await payload.find({ collection: 'journalLines', where: { entry: { equals: e.id } }, limit: 20, overrideAccess: true })
          for (const jl of lines.docs) await payload.delete({ collection: 'journalLines', id: jl.id, overrideAccess: true })
          await payload.delete({ collection: 'journalEntries', id: e.id, overrideAccess: true })
        }
        await payload.delete({ collection: 'stockLots', id: l.id, overrideAccess: true })
      }
      await payload.delete({ collection: 'variants', id: v.id, overrideAccess: true })
    }
    await payload.delete({ collection: 'products', id: p.id, overrideAccess: true })
  }
}

describe('Hardening — RBAC + abandoned release + expiry write-off (§4.6, §10.3, #11)', () => {
  let variantId: number
  let lotId: number
  let owner: User
  let packer: User

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await ensureAccounts(payload)
    await cleanup()
    owner = await payload.create({ collection: 'users', data: { email: OWNER, password: 'test1234', roles: ['owner'] }, overrideAccess: true })
    packer = await payload.create({ collection: 'users', data: { email: PACKER, password: 'test1234', roles: ['packer'] }, overrideAccess: true })
    const product = await payload.create({ collection: 'products', data: { title: TITLE, slug: SLUG, _status: 'published' }, overrideAccess: true })
    const variant = await payload.create({ collection: 'variants', data: { product: product.id, sku: SKU, mrp: 500, weightGrams: 100, active: true }, overrideAccess: true })
    variantId = variant.id
    const lot = await payload.create({
      collection: 'stockLots',
      data: { variant: variantId, lotCode: 'TESTHARDLOT', expDate: '2029-01-01', qtyReceived: 20, landedCostPerUnit: 300, status: 'open' },
      overrideAccess: true,
    })
    lotId = lot.id
    await payload.create({ collection: 'stockMovements', data: { lot: lot.id, variant: variantId, qty: 20, type: 'receipt' }, overrideAccess: true })
  }, 60000)

  afterAll(async () => cleanup())

  it('packer CANNOT see landed cost on stockLots; owner can (§4.6 done-criterion)', async () => {
    const asPacker = await payload.findByID({ collection: 'stockLots', id: lotId, overrideAccess: false, user: packer as never })
    expect(asPacker.landedCostPerUnit).toBeUndefined() // COGS stripped
    expect(asPacker.lotCode).toBe('TESTHARDLOT') // non-cost fields still visible (packer picks stock)

    const asOwner = await payload.findByID({ collection: 'stockLots', id: lotId, overrideAccess: false, user: owner as never })
    expect(asOwner.landedCostPerUnit).toBe(300)
  })

  it('packer CANNOT see landed cost on order line snapshots, and is denied the accounting ledger', async () => {
    const { order } = await placeOrder({ lines: [{ variantId, qty: 2 }], zone: 'dhakaCity', customer: { name: 'Cost Test', phone: PHONES[0], address: 'Banani' }, paymentChoice: 'cod' })
    const asPacker = await payload.findByID({ collection: 'orders', id: order.id, overrideAccess: false, user: packer as never, depth: 0 })
    expect(asPacker.items?.[0]?.lotAllocations?.[0]?.landedCostSnapshot).toBeUndefined()
    expect(asPacker.codAmount).toBe(1080) // packer DOES see the COD amount (§4.6)

    // Accounting is owner/manager/accounts only — a packer is denied the ledger outright.
    await expect(payload.find({ collection: 'journalEntries', overrideAccess: false, user: packer as never, limit: 1 })).rejects.toThrow(/Forbidden|not allowed/)
  })

  it('cancelStaleOrders releases an abandoned pending order’s reservations (#11)', async () => {
    const before = await payload.findByID({ collection: 'variants', id: variantId, overrideAccess: true })
    const { order, payment } = await placeOrder({ lines: [{ variantId, qty: 3 }], zone: 'outside', customer: { name: 'Abandon', phone: PHONES[0], address: 'Rajshahi' }, paymentChoice: 'cod' })
    expect(payment.required).toBe(true) // outside → EPS advance → pending
    const reserved = await payload.findByID({ collection: 'variants', id: variantId, overrideAccess: true })
    expect(reserved.availableQty).toBe((before.availableQty ?? 0) - 3)

    // Cutoff in the future so the just-placed order counts as stale.
    const res = await cancelStaleOrders(payload, new Date(Date.now() + 60_000).toISOString())
    expect(res.released).toBeGreaterThanOrEqual(1)
    const after = await payload.findByID({ collection: 'orders', id: order.id, overrideAccess: true })
    expect(after.fulfilmentStatus).toBe('cancelled')
    const restored = await payload.findByID({ collection: 'variants', id: variantId, overrideAccess: true })
    expect(restored.availableQty).toBe(before.availableQty) // reservation returned
  })

  it('runExpiryScan expires a past-EXP lot and writes it off to 5020 (§10.3, #5)', async () => {
    const product = (await payload.find({ collection: 'products', where: { slug: { equals: SLUG } }, limit: 1, overrideAccess: true })).docs[0]
    const variant = await payload.create({ collection: 'variants', data: { product: product.id, sku: `${SKU}-EXP`, mrp: 500, weightGrams: 100, active: true }, overrideAccess: true })
    const lot = await payload.create({ collection: 'stockLots', data: { variant: variant.id, lotCode: 'EXPIRED-LOT', expDate: '2020-01-01', qtyReceived: 5, landedCostPerUnit: 100, status: 'open' }, overrideAccess: true })
    await payload.create({ collection: 'stockMovements', data: { lot: lot.id, variant: variant.id, qty: 5, type: 'receipt' }, overrideAccess: true })

    const res = await runExpiryScan(payload, Date.now())
    expect(res.expired).toBeGreaterThanOrEqual(1)

    const after = await payload.findByID({ collection: 'stockLots', id: lot.id, overrideAccess: true })
    expect(after.status).toBe('expired')
    const v = await payload.findByID({ collection: 'variants', id: variant.id, overrideAccess: true })
    expect(v.availableQty).toBe(0) // written off out of available

    const entry = await payload.find({ collection: 'journalEntries', where: { and: [{ sourceId: { equals: `lot-${lot.id}` } }, { ref: { equals: 'writeoff-expiry' } }] }, limit: 1, overrideAccess: true })
    expect(entry.docs.length).toBe(1)
    const lines = await payload.find({ collection: 'journalLines', where: { entry: { equals: entry.docs[0].id } }, depth: 1, limit: 10, overrideAccess: true })
    const byCode = (code: string) => lines.docs.filter((l) => String((l.account as { code?: string }).code) === code)
    expect(byCode('5020')[0]?.debit).toBe(500) // Dr write-off
    expect(byCode('1050')[0]?.credit).toBe(500) // Cr inventory

    // local cleanup for this extra variant/lot
    const entries = await payload.find({ collection: 'journalEntries', where: { sourceId: { equals: `lot-${lot.id}` } }, limit: 10, overrideAccess: true })
    for (const e of entries.docs) {
      await payload.update({ collection: 'journalEntries', id: e.id, data: { status: 'void' }, overrideAccess: true })
      const jls = await payload.find({ collection: 'journalLines', where: { entry: { equals: e.id } }, limit: 20, overrideAccess: true })
      for (const jl of jls.docs) await payload.delete({ collection: 'journalLines', id: jl.id, overrideAccess: true })
      await payload.delete({ collection: 'journalEntries', id: e.id, overrideAccess: true })
    }
    const moves = await payload.find({ collection: 'stockMovements', where: { variant: { equals: variant.id } }, limit: 50, overrideAccess: true })
    for (const m of moves.docs) await payload.delete({ collection: 'stockMovements', id: m.id, overrideAccess: true })
    await payload.delete({ collection: 'stockLots', id: lot.id, overrideAccess: true })
    await payload.delete({ collection: 'variants', id: variant.id, overrideAccess: true })
  })
})
