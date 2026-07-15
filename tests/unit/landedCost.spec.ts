import { describe, it, expect } from 'vitest'

import { computeLandedCosts, round4, type POLineInput, type Overheads } from '@/lib/inventory/landedCost'

// Two lines, KRW→BDT fx 0.085, overhead pool = 2000+1000+500+300+200 = 4000
const lines: POLineInput[] = [
  { qty: 10, unitCostForeign: 1000, weightGramsEach: 100 }, // BDT value 850
  { qty: 5, unitCostForeign: 3000, weightGramsEach: 50 }, //  BDT value 1275
]
const overheads: Overheads = {
  freightBDT: 2000,
  dutyBDT: 1000,
  vatAtImportBDT: 500,
  clearingBDT: 300,
  otherChargesBDT: 200,
}
const fx = 0.085

describe('computeLandedCosts', () => {
  it('byValue splits overhead by BDT value (0.4 / 0.6)', () => {
    const r = computeLandedCosts(lines, overheads, fx, 'byValue')
    // A: (850 + 4000*0.4)/10 = 245 ; B: (1275 + 4000*0.6)/5 = 735
    expect(r[0].landedCostPerUnit).toBe(245)
    expect(r[1].landedCostPerUnit).toBe(735)
  })

  it('byWeight splits overhead by total grams (1000 / 250)', () => {
    const r = computeLandedCosts(lines, overheads, fx, 'byWeight')
    // total 1250g → A 3200, B 800 ; A (850+3200)/10=405 ; B (1275+800)/5=415
    expect(r[0].landedCostPerUnit).toBe(405)
    expect(r[1].landedCostPerUnit).toBe(415)
  })

  it('byQty splits overhead by units (10 / 5)', () => {
    const r = computeLandedCosts(lines, overheads, fx, 'byQty')
    // total 15 → A 2666.6667, B 1333.3333 ; A (850+2666.6667)/10 ; B (1275+1333.3333)/5
    expect(r[0].landedCostPerUnit).toBe(round4((850 + (4000 * 10) / 15) / 10))
    expect(r[1].landedCostPerUnit).toBe(round4((1275 + (4000 * 5) / 15) / 5))
  })

  it('overhead shares sum to the full pool (conservation)', () => {
    const r = computeLandedCosts(lines, overheads, fx, 'byValue')
    const totalShare = r[0].lineOverheadShare * 1 + r[1].lineOverheadShare * 1
    expect(round4(totalShare)).toBe(4000)
  })

  it('no overhead + single line → landed cost is just BDT unit cost', () => {
    const r = computeLandedCosts(
      [{ qty: 4, unitCostForeign: 100, weightGramsEach: 10 }],
      { freightBDT: 0, dutyBDT: 0, vatAtImportBDT: 0, clearingBDT: 0, otherChargesBDT: 0 },
      2,
      'byValue',
    )
    expect(r[0].landedCostPerUnit).toBe(200) // 100 * 2
  })

  it('zero total weight (all-zero qty) does not divide by zero', () => {
    const r = computeLandedCosts([{ qty: 0, unitCostForeign: 100, weightGramsEach: 0 }], overheads, fx, 'byValue')
    expect(r[0].landedCostPerUnit).toBe(0)
  })
})
