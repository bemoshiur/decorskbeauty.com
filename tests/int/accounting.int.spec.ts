import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

import type { Account } from '@/payload-types'
import { placeOrder } from '@/lib/commerce/placeOrder'
import { markHandedToCourier, markDelivered, markReturned } from '@/lib/commerce/fulfilment'
import { ensureAccounts, postJournal } from '@/lib/accounting'
import { computeTrialBalance } from '@/lib/accounting/trialBalance'

let payload: Payload

const TITLE = 'TEST Accounting Product'
const SLUG = 'test-accounting-product'
const SKU = 'TEST-ACC-1'
const LANDED = 300
const PHONES = ['8801710000001', '8801710000002', '8801710000003']

type Line = { code: string; debit: number; credit: number }

/** Fetch a posted entry's lines as {code,debit,credit}. */
async function linesOf(source: string, sourceId: string, ref: string): Promise<Line[]> {
  const { docs: entries } = await payload.find({
    collection: 'journalEntries',
    where: { and: [{ source: { equals: source } }, { sourceId: { equals: sourceId } }, { ref: { equals: ref } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const entry = entries[0]
  if (!entry) return []
  const { docs: lines } = await payload.find({ collection: 'journalLines', where: { entry: { equals: entry.id } }, depth: 1, limit: 100, overrideAccess: true })
  return lines.map((l) => ({ code: String((l.account as Account).code), debit: l.debit ?? 0, credit: l.credit ?? 0 }))
}
const dr = (l: Line[], code: string) => l.filter((x) => x.code === code).reduce((s, x) => s + x.debit, 0)
const cr = (l: Line[], code: string) => l.filter((x) => x.code === code).reduce((s, x) => s + x.credit, 0)
const bal = (l: Line[]) => Math.round((l.reduce((s, x) => s + x.debit, 0) - l.reduce((s, x) => s + x.credit, 0)) * 100) / 100

async function purgeEntries(sourceId: string) {
  const { docs } = await payload.find({ collection: 'journalEntries', where: { sourceId: { equals: sourceId } }, limit: 100, depth: 0, overrideAccess: true })
  for (const e of docs) {
    // Void FIRST — a posted entry's lines are immutable (Fix D); voiding unlocks them for cleanup.
    if (e.status === 'posted') await payload.update({ collection: 'journalEntries', id: e.id, data: { status: 'void' }, overrideAccess: true })
    const { docs: lines } = await payload.find({ collection: 'journalLines', where: { entry: { equals: e.id } }, limit: 100, depth: 0, overrideAccess: true })
    for (const l of lines) await payload.delete({ collection: 'journalLines', id: l.id, overrideAccess: true })
    await payload.delete({ collection: 'journalEntries', id: e.id, overrideAccess: true })
  }
}

async function cleanup() {
  const custs = await payload.find({ collection: 'customers', where: { phone: { in: PHONES } }, limit: 50, depth: 0 })
  for (const c of custs.docs) {
    const orders = await payload.find({ collection: 'orders', where: { customer: { equals: c.id } }, limit: 50, depth: 0 })
    for (const o of orders.docs) {
      await purgeEntries(String(o.id))
      const rets = await payload.find({ collection: 'returns', where: { order: { equals: o.id } }, limit: 50, depth: 0 })
      for (const r of rets.docs) await payload.delete({ collection: 'returns', id: r.id, overrideAccess: true })
      await payload.delete({ collection: 'orders', id: o.id, overrideAccess: true })
    }
    await payload.delete({ collection: 'customers', id: c.id, overrideAccess: true })
  }
  const products = await payload.find({ collection: 'products', where: { slug: { equals: SLUG } }, limit: 20, depth: 0 })
  for (const p of products.docs) {
    const variants = await payload.find({ collection: 'variants', where: { product: { equals: p.id } }, limit: 20, depth: 0 })
    for (const v of variants.docs) {
      const moves = await payload.find({ collection: 'stockMovements', where: { variant: { equals: v.id } }, limit: 500, depth: 0 })
      for (const m of moves.docs) await payload.delete({ collection: 'stockMovements', id: m.id, overrideAccess: true })
      const lots = await payload.find({ collection: 'stockLots', where: { variant: { equals: v.id } }, limit: 50, depth: 0 })
      for (const l of lots.docs) await payload.delete({ collection: 'stockLots', id: l.id, overrideAccess: true })
      await payload.delete({ collection: 'variants', id: v.id, overrideAccess: true })
    }
    await payload.delete({ collection: 'products', id: p.id, overrideAccess: true })
  }
}

describe('Accounting — balanced journals through the order lifecycle (§12, #5/#6)', () => {
  let variantId: number

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await ensureAccounts(payload)
    await cleanup()
    const product = await payload.create({ collection: 'products', data: { title: TITLE, slug: SLUG, _status: 'published' } })
    const variant = await payload.create({ collection: 'variants', data: { product: product.id, sku: SKU, mrp: 500, weightGrams: 100, active: true } })
    variantId = variant.id
    const lot = await payload.create({
      collection: 'stockLots',
      data: { variant: variantId, lotCode: 'TESTACCLOT', expDate: '2028-01-01', qtyReceived: 20, landedCostPerUnit: LANDED, status: 'open' },
      overrideAccess: true,
    })
    await payload.create({ collection: 'stockMovements', data: { lot: lot.id, variant: variantId, qty: 20, type: 'receipt' }, overrideAccess: true })
  }, 60000)

  afterAll(async () => cleanup())

  it('the journal writer balances, is idempotent, and rejects an unbalanced entry', async () => {
    const src = 'manual-test-1'
    await purgeEntries(src)
    const ok = await postJournal(payload, {
      source: 'manual',
      sourceId: src,
      ref: 'test',
      lines: [{ account: '1020', debit: 100, credit: 0 }, { account: '3010', debit: 0, credit: 100 }],
    })
    expect(ok?.status).toBe('posted')
    // Idempotent: same (source,sourceId,ref) returns the same entry, no duplicate.
    const again = await postJournal(payload, { source: 'manual', sourceId: src, ref: 'test', lines: [{ account: '1020', debit: 100, credit: 0 }, { account: '3010', debit: 0, credit: 100 }] })
    expect(again?.id).toBe(ok?.id)
    const { totalDocs } = await payload.count({ collection: 'journalEntries', where: { sourceId: { equals: src } } })
    expect(totalDocs).toBe(1)
    // Unbalanced is rejected before any write.
    await expect(
      postJournal(payload, { source: 'manual', sourceId: src, ref: 'bad', lines: [{ account: '1020', debit: 100, credit: 0 }, { account: '3010', debit: 0, credit: 99 }] }),
    ).rejects.toThrow(/does not balance/)
    await purgeEntries(src)
  })

  it('a posted entry’s lines are immutable — cannot edit or delete a leg (#5 bypass closed)', async () => {
    const src = 'immutable-test-1'
    await purgeEntries(src)
    const entry = await postJournal(payload, { source: 'manual', sourceId: src, ref: 'test', lines: [{ account: '1020', debit: 100, credit: 0 }, { account: '3010', debit: 0, credit: 100 }] })
    const { docs: lines } = await payload.find({ collection: 'journalLines', where: { entry: { equals: entry!.id } }, limit: 10, overrideAccess: true })
    // Editing a leg of a posted entry (which would unbalance it) is rejected.
    await expect(payload.update({ collection: 'journalLines', id: lines[0].id, data: { debit: 90 }, overrideAccess: true })).rejects.toThrow(/posted|immutable/)
    // Deleting a leg is rejected too.
    await expect(payload.delete({ collection: 'journalLines', id: lines[0].id, overrideAccess: true })).rejects.toThrow(/posted|immutable/)
    // The ledger is untouched.
    const still = await linesOf('manual', src, 'test')
    expect(bal(still)).toBe(0)
    await purgeEntries(src)
  })

  it('rejects posting into a closed fiscal period (§12.6)', async () => {
    const month = '2020-01'
    const existing = await payload.find({ collection: 'fiscalPeriods', where: { month: { equals: month } }, limit: 1, overrideAccess: true })
    const period = existing.docs[0] ?? (await payload.create({ collection: 'fiscalPeriods', data: { month, status: 'closed' }, overrideAccess: true }))
    if (period.status !== 'closed') await payload.update({ collection: 'fiscalPeriods', id: period.id, data: { status: 'closed' }, overrideAccess: true })
    await expect(
      postJournal(payload, { date: `${month}-15T00:00:00.000Z`, source: 'manual', sourceId: 'closed-test', ref: 'x', lines: [{ account: '1020', debit: 10, credit: 0 }, { account: '3010', debit: 0, credit: 10 }] }),
    ).rejects.toThrow(/closed/)
    await payload.delete({ collection: 'fiscalPeriods', id: period.id, overrideAccess: true })
  })

  it('COD order recognizes NOTHING until delivery, then posts a balanced sale + COGS (#5/#6)', async () => {
    const { order } = await placeOrder({ lines: [{ variantId, qty: 2 }], zone: 'dhakaCity', customer: { name: 'Ledger Buyer', phone: PHONES[0], address: 'Banani' }, paymentChoice: 'cod' })
    const sid = String(order.id)

    // Confirmed + handed to courier → still no revenue (delivery-time recognition).
    await markHandedToCourier(payload, order.id)
    expect(await linesOf('order', sid, 'sale')).toHaveLength(0)

    await markDelivered(payload, order.id)
    const sale = await linesOf('order', sid, 'sale')
    expect(bal(sale)).toBe(0)
    expect(dr(sale, '1040')).toBe(1080) // COD receivable = grandTotal (2×500 + 80), no advance
    expect(cr(sale, '4010')).toBe(1000)
    expect(cr(sale, '4020')).toBe(80)

    const cogs = await linesOf('order', sid, 'cogs')
    expect(bal(cogs)).toBe(0)
    expect(dr(cogs, '5010')).toBe(2 * LANDED)
    expect(cr(cogs, '1050')).toBe(2 * LANDED)

    // Re-delivering is idempotent (no duplicate sale entry).
    await markDelivered(payload, order.id)
    const { totalDocs } = await payload.count({ collection: 'journalEntries', where: { and: [{ sourceId: { equals: sid } }, { ref: { equals: 'sale' } }] } })
    expect(totalDocs).toBe(1)
  })

  it('a delivered order returned by the customer reverses the sale and refunds (§12.3 row 11)', async () => {
    const { order } = await placeOrder({ lines: [{ variantId, qty: 1 }], zone: 'dhakaCity', customer: { name: 'Return Buyer', phone: PHONES[1], address: 'Banani' }, paymentChoice: 'cod' })
    const sid = String(order.id)
    await markHandedToCourier(payload, order.id)
    await markDelivered(payload, order.id)
    await markReturned(payload, order.id, 'customerReturn')

    const rev = await linesOf('order', sid, 'customer-return')
    expect(bal(rev)).toBe(0)
    expect(dr(rev, '4040')).toBe(580) // 500 + 80 delivery reversed
    expect(cr(rev, '1020')).toBe(580) // refunded from bank
    expect(dr(rev, '1050')).toBe(LANDED) // restock at original landed cost (#12)
    expect(cr(rev, '5010')).toBe(LANDED)
  })

  it('an in-transit RTO recognized nothing, so it reverses nothing', async () => {
    const { order } = await placeOrder({ lines: [{ variantId, qty: 1 }], zone: 'dhakaCity', customer: { name: 'RTO Buyer', phone: PHONES[2], address: 'Banani' }, paymentChoice: 'cod' })
    const sid = String(order.id)
    await markHandedToCourier(payload, order.id)
    await markReturned(payload, order.id, 'rto')
    expect(await linesOf('order', sid, 'sale')).toHaveLength(0)
    expect(await linesOf('order', sid, 'customer-return')).toHaveLength(0)
  })

  it('the trial balance ties out (Σ debits === Σ credits, §12.6)', async () => {
    const tb = await computeTrialBalance(payload)
    expect(tb.balanced).toBe(true)
    expect(tb.totalDebit).toBe(tb.totalCredit)
  })
})
