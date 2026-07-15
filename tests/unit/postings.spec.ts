import { describe, it, expect } from 'vitest'

import {
  postPoReceived,
  postAdvanceReceived,
  postSaleRevenue,
  postSaleCogs,
  postCustomerReturnRefund,
  postCourierRemitsCod,
  postEpsSettles,
  postRtoCourierCharge,
  postWriteOff,
  postAdSpend,
  type PostingLine,
} from '@/lib/accounting/postings'
import { validateBalance } from '@/lib/accounting/postJournal'

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
const sumDr = (l: PostingLine[]) => round2(l.reduce((s, x) => s + x.debit, 0))
const sumCr = (l: PostingLine[]) => round2(l.reduce((s, x) => s + x.credit, 0))
/** amount posted to an account: +debit / −credit (so a pure debit is positive). */
const at = (l: PostingLine[], code: string) => round2(l.filter((x) => x.account === code).reduce((s, x) => s + x.debit - x.credit, 0))
const has = (l: PostingLine[], code: string) => l.some((x) => x.account === code)

function expectBalanced(l: PostingLine[]) {
  expect(sumDr(l)).toBe(sumCr(l))
  expect(validateBalance(l)).toBeNull()
  for (const line of l) {
    expect(line.debit === 0 || line.credit === 0).toBe(true) // exactly one side
    expect(line.debit >= 0 && line.credit >= 0).toBe(true)
  }
}

describe('Posting rules (§12.3) — every entry balances and hits the right accounts', () => {
  it('PO received: Dr 1050 Inventory, Cr 2010 AP (row 1)', () => {
    const l = postPoReceived({ landedTotal: 12345.67, poRef: 'PO-1' })
    expectBalanced(l)
    expect(at(l, '1050')).toBe(12345.67)
    expect(at(l, '2010')).toBe(-12345.67)
  })

  it('Advance/prepay received: Dr 1030 EPS receivable, Cr 2030 Customer advances (rows 2–3, #6)', () => {
    const l = postAdvanceReceived({ amount: 200, orderRef: 'DKB-1' })
    expectBalanced(l)
    expect(at(l, '1030')).toBe(200)
    expect(at(l, '2030')).toBe(-200)
    expect(has(l, '4010')).toBe(false) // never revenue on receipt (#6)
  })

  it('Sale on delivery, COD no advance: Dr 1040, Cr 4010 + 4020', () => {
    const l = postSaleRevenue({ subtotal: 1000, deliveryCharge: 80, advanceApplied: 0, codReceivable: 1080, orderRef: 'DKB-2' })
    expectBalanced(l)
    expect(at(l, '1040')).toBe(1080)
    expect(at(l, '4010')).toBe(-1000)
    expect(at(l, '4020')).toBe(-80)
    expect(has(l, '2030')).toBe(false)
    expect(has(l, '2020')).toBe(false) // vat 0
  })

  it('Sale on delivery with advance: releases 2030, books 1040 remainder', () => {
    const l = postSaleRevenue({ subtotal: 500, deliveryCharge: 140, advanceApplied: 200, codReceivable: 440, orderRef: 'DKB-3' })
    expectBalanced(l)
    expect(at(l, '2030')).toBe(200) // debit releases the liability
    expect(at(l, '1040')).toBe(440)
    expect(at(l, '4010')).toBe(-500)
    expect(at(l, '4020')).toBe(-140)
  })

  it('Sale on delivery, full prepay: releases the whole 2030, no COD receivable', () => {
    const l = postSaleRevenue({ subtotal: 1000, deliveryCharge: 80, advanceApplied: 1080, codReceivable: 0, orderRef: 'DKB-4' })
    expectBalanced(l)
    expect(at(l, '2030')).toBe(1080)
    expect(has(l, '1040')).toBe(false)
  })

  it('Sale with VAT is carved out of 4010 (inclusive), stays balanced against grandTotal', () => {
    const l = postSaleRevenue({ subtotal: 1150, deliveryCharge: 0, advanceApplied: 0, codReceivable: 1150, vat: 150, orderRef: 'DKB-5' })
    expectBalanced(l)
    expect(at(l, '1040')).toBe(1150)
    expect(at(l, '4010')).toBe(-1000) // 1150 − 150 VAT
    expect(at(l, '2020')).toBe(-150)
  })

  it('Sale with a discount books GROSS to 4010 and the discount to the 4030 contra, still balanced', () => {
    // order.subtotal is NET of discount (checkout stores gross−discount); gross was 1000, discount 200.
    const l = postSaleRevenue({ subtotal: 800, deliveryCharge: 80, discount: 200, advanceApplied: 0, codReceivable: 880, orderRef: 'DKB-D' })
    expectBalanced(l) // was the bug: net 4010 + separate 4030 debit → off by `discount`
    expect(at(l, '4010')).toBe(-1000) // gross product sales
    expect(at(l, '4030')).toBe(200) // discount contra (debit) nets it back to 800
    expect(at(l, '1040')).toBe(880) // collectable = grandTotal (800 net + 80 delivery)
    expect(at(l, '4020')).toBe(-80)
  })

  it('COGS on delivery: Dr 5010, Cr 1050 (row 5)', () => {
    const l = postSaleCogs({ cogs: 600, orderRef: 'DKB-6' })
    expectBalanced(l)
    expect(at(l, '5010')).toBe(600)
    expect(at(l, '1050')).toBe(-600)
  })

  it('Customer return refunded: Dr 4040 + 1050, Cr 1020 + 5010 (row 11)', () => {
    const l = postCustomerReturnRefund({ returnsAmount: 1080, bankRefund: 1080, cogs: 600, orderRef: 'DKB-7' })
    expectBalanced(l)
    expect(at(l, '4040')).toBe(1080)
    expect(at(l, '1050')).toBe(600) // restock at original landed cost (#12)
    expect(at(l, '1020')).toBe(-1080)
    expect(at(l, '5010')).toBe(-600)
  })

  it('Courier remits COD: Dr 1020 + 6010, Cr 1040 (row 7)', () => {
    const l = postCourierRemitsCod({ bank: 1050, courierFee: 30, codReceivable: 1080, orderRef: 'DKB-8' })
    expectBalanced(l)
    expect(at(l, '1020')).toBe(1050)
    expect(at(l, '6010')).toBe(30)
    expect(at(l, '1040')).toBe(-1080)
  })

  it('EPS settles: Dr 1020 + 6020, Cr 1030 (row 8)', () => {
    const l = postEpsSettles({ bank: 194, mdr: 6, gross: 200 })
    expectBalanced(l)
    expect(at(l, '1020')).toBe(194)
    expect(at(l, '6020')).toBe(6)
    expect(at(l, '1030')).toBe(-200)
  })

  it('RTO courier charge: Dr 6010, Cr 1040 (row 10)', () => {
    const l = postRtoCourierCharge({ fee: 60, orderRef: 'DKB-9' })
    expectBalanced(l)
    expect(at(l, '6010')).toBe(60)
    expect(at(l, '1040')).toBe(-60)
  })

  it('Write-off: Dr 5020, Cr 1050 (row 12)', () => {
    const l = postWriteOff({ amount: 300 })
    expectBalanced(l)
    expect(at(l, '5020')).toBe(300)
    expect(at(l, '1050')).toBe(-300)
  })

  it('Ad spend: Dr 6040, Cr 1020 (row 13)', () => {
    const l = postAdSpend({ amount: 5000 })
    expectBalanced(l)
    expect(at(l, '6040')).toBe(5000)
    expect(at(l, '1020')).toBe(-5000)
  })
})

describe('validateBalance (§4.4 / #5)', () => {
  it('accepts a balanced entry', () => {
    expect(validateBalance([{ debit: 100, credit: 0 }, { debit: 0, credit: 100 }])).toBeNull()
  })
  it('rejects an unbalanced entry', () => {
    expect(validateBalance([{ debit: 100, credit: 0 }, { debit: 0, credit: 99 }])).toMatch(/does not balance/)
  })
  it('rejects a line with both a debit and a credit', () => {
    expect(validateBalance([{ debit: 100, credit: 100 }])).toMatch(/exactly one/)
  })
  it('rejects an empty entry and a zero line and a negative line', () => {
    expect(validateBalance([])).toMatch(/no lines/)
    expect(validateBalance([{ debit: 0, credit: 0 }])).toMatch(/neither/)
    expect(validateBalance([{ debit: -5, credit: 0 }, { debit: 0, credit: -5 }])).toMatch(/negative/)
  })
})
