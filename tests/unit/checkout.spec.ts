import { describe, it, expect } from 'vitest'

import { computeCheckoutTerms, type CartForTerms, type Zone } from '@/lib/commerce/checkout'

const ready = (unitPrice: number, qty = 1) => ({ unitPrice, qty })
const pre = (unitPrice: number, qty = 1) => ({ unitPrice, qty, isPreOrder: true })
const cart = (lines: CartForTerms['lines'], discountTotal = 0): CartForTerms => ({ lines, discountTotal })
const terms = (c: CartForTerms, z: Zone) => computeCheckoutTerms(c, z)

describe('computeCheckoutTerms — §1.1', () => {
  describe('zones + delivery', () => {
    it('Dhaka City: ৳80, full COD', () => {
      const t = terms(cart([ready(1000)]), 'dhakaCity')
      expect(t).toMatchObject({ deliveryCharge: 80, grandTotal: 1080, advanceRequired: 0, codAmount: 1080, codAllowed: true })
    })
    it('Dhaka Sub-urban: ৳110, full COD', () => {
      const t = terms(cart([ready(1000)]), 'dhakaSub')
      expect(t).toMatchObject({ deliveryCharge: 110, grandTotal: 1110, advanceRequired: 0, codAmount: 1110 })
    })
    it('Outside Dhaka: ৳140 + ৳200 advance, remainder COD', () => {
      const t = terms(cart([ready(1000)]), 'outside')
      expect(t).toMatchObject({ deliveryCharge: 140, grandTotal: 1140, advanceRequired: 200, codAmount: 940, codAllowed: true })
    })
  })

  describe('rule 2 — free shipping (subtotal ≥ ৳4,999, after discount, before delivery)', () => {
    it('subtotal exactly 4999 → free delivery, no advance (grand not > 5000)', () => {
      const t = terms(cart([ready(4999)]), 'dhakaCity')
      expect(t).toMatchObject({ subtotal: 4999, deliveryCharge: 0, grandTotal: 4999, advanceRequired: 0, codAmount: 4999 })
    })
    it('subtotal 4998 → pays delivery (and grand then crosses 5000 → 30%)', () => {
      const t = terms(cart([ready(4998)]), 'dhakaCity')
      // 4998 + 80 = 5078 > 5000 → round(5078*0.3)=1523
      expect(t).toMatchObject({ deliveryCharge: 80, grandTotal: 5078, advanceRequired: 1523, codAmount: 3555 })
    })
    it('free shipping is measured after discount', () => {
      const t = terms(cart([ready(6000)], 1200), 'dhakaCity') // subtotal 4800 < 4999
      expect(t).toMatchObject({ subtotal: 4800, deliveryCharge: 80, grandTotal: 4880, advanceRequired: 0 })
    })
  })

  describe('rule 1 — grandTotal > ৳5,000 → 30% (on grandTotal, incl. delivery)', () => {
    it('CLAUDE.md example: ৳6,000 outside takes 30% = ৳1,800, NOT ৳2,000 (never both)', () => {
      const t = terms(cart([ready(6000)]), 'outside') // free ship → grand 6000
      expect(t.grandTotal).toBe(6000)
      expect(t.advanceRequired).toBe(1800) // max(200, 1800), not 200 + 1800
      expect(t.codAmount).toBe(4200)
    })
    it('question-C edge: subtotal 4900 outside → grand 5040 > 5000 → 30% of grand = 1512', () => {
      const t = terms(cart([ready(4900)]), 'outside') // 4900 < 4999 → delivery 140 → grand 5040
      expect(t).toMatchObject({ deliveryCharge: 140, grandTotal: 5040, advanceRequired: 1512, codAmount: 3528 })
    })
    it('boundary: grand EXACTLY 5000 → no 30% (outside flat ৳200 only)', () => {
      const t = terms(cart([ready(4860)]), 'outside') // 4860 + 140 = 5000, not > 5000
      expect(t).toMatchObject({ grandTotal: 5000, advanceRequired: 200, codAmount: 4800 })
    })
    it('boundary: grand 5001 → 30% kicks in (round 1500)', () => {
      const t = terms(cart([ready(4861)]), 'outside') // 4861 + 140 = 5001 > 5000
      expect(t.grandTotal).toBe(5001)
      expect(t.advanceRequired).toBe(1500) // round(5001*0.3)=1500, max(200,1500)
    })
    it('30% applies in Dhaka City too (regardless of zone)', () => {
      const t = terms(cart([ready(6000)]), 'dhakaCity') // free ship → grand 6000
      expect(t.advanceRequired).toBe(1800)
    })
  })

  describe('rule 3 — any pre-order line → 100% advance, no COD (supersedes 1 & 2)', () => {
    it('pre-order → full advance, cod 0, COD not offered', () => {
      const t = terms(cart([pre(1000)]), 'dhakaCity')
      expect(t).toMatchObject({ grandTotal: 1080, advanceRequired: 1080, codAmount: 0, codAllowed: false })
    })
    it('pre-order supersedes the 30% rule (still 100%, not 30%)', () => {
      const t = terms(cart([pre(6000)]), 'outside') // free ship → grand 6000
      expect(t).toMatchObject({ grandTotal: 6000, advanceRequired: 6000, codAmount: 0, codAllowed: false })
    })
    it('free shipping still applies to a pre-order', () => {
      const t = terms(cart([pre(5000)]), 'outside') // subtotal 5000 ≥ 4999 → free
      expect(t).toMatchObject({ deliveryCharge: 0, grandTotal: 5000, advanceRequired: 5000, codAmount: 0 })
    })
    it('mixed cart (one pre-order + one ready) → whole order 100% advance', () => {
      const t = terms(cart([ready(500), pre(700)]), 'dhakaCity')
      expect(t).toMatchObject({ grandTotal: 1280, advanceRequired: 1280, codAmount: 0, codAllowed: false })
    })
  })

  describe('invariants', () => {
    const cases: [CartForTerms, Zone][] = [
      [cart([ready(1000)]), 'dhakaCity'],
      [cart([ready(4900)]), 'outside'],
      [cart([ready(6000)]), 'outside'],
      [cart([pre(6000)]), 'outside'],
      [cart([ready(4999)]), 'dhakaSub'],
    ]
    it('codAmount always equals grandTotal − advanceRequired', () => {
      for (const [c, z] of cases) {
        const t = terms(c, z)
        expect(t.codAmount).toBe(t.grandTotal - t.advanceRequired)
      }
    })
    it('advance never exceeds grandTotal; never negative', () => {
      for (const [c, z] of cases) {
        const t = terms(c, z)
        expect(t.advanceRequired).toBeGreaterThanOrEqual(0)
        expect(t.advanceRequired).toBeLessThanOrEqual(t.grandTotal)
      }
    })
    it('always yields a plain-language reason', () => {
      for (const [c, z] of cases) expect(terms(c, z).reason.length).toBeGreaterThan(0)
    })
  })
})
