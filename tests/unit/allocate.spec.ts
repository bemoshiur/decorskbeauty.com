import { describe, it, expect } from 'vitest'

import { allocateFefo, getFefoLot, isFefoEligible, type AllocatableLot } from '@/lib/inventory/allocate'

// Fixed "now": 2026-07-15
const NOW = Date.parse('2026-07-15T00:00:00Z')
const D = (iso: string) => iso

const lot = (over: Partial<AllocatableLot> & { id: number }): AllocatableLot => ({
  expDate: '2028-01-01',
  receivedAt: '2026-03-01',
  qtyAvailable: 10,
  landedCostPerUnit: 100,
  status: 'open',
  ...over,
})

describe('FEFO allocation', () => {
  it('allocates earliest EXP first', () => {
    const lots = [
      lot({ id: 1, expDate: D('2028-06-01') }),
      lot({ id: 2, expDate: D('2027-06-01') }), // earliest → first
      lot({ id: 3, expDate: D('2029-06-01') }),
    ]
    const { allocations } = allocateFefo(lots, 5, NOW)
    expect(allocations[0].lotId).toBe(2)
  })

  it('tiebreaks equal EXP by earliest receivedAt', () => {
    const lots = [
      lot({ id: 1, expDate: D('2027-06-01'), receivedAt: '2026-05-01' }),
      lot({ id: 2, expDate: D('2027-06-01'), receivedAt: '2026-02-01' }), // earlier receipt
    ]
    const { allocations } = allocateFefo(lots, 3, NOW)
    expect(allocations[0].lotId).toBe(2)
  })

  it('skips quarantined and expired lots', () => {
    const lots = [
      lot({ id: 1, expDate: D('2027-01-01'), status: 'quarantined' }),
      lot({ id: 2, expDate: D('2027-02-01'), status: 'expired' }),
      lot({ id: 3, expDate: D('2027-03-01'), status: 'open' }),
    ]
    const { allocations } = allocateFefo(lots, 5, NOW)
    expect(allocations.map((a) => a.lotId)).toEqual([3])
  })

  it('skips lots inside the <3-month near-expiry window (§10.3)', () => {
    const lots = [
      lot({ id: 1, expDate: D('2026-08-15') }), // ~1 month → blocked
      lot({ id: 2, expDate: D('2026-11-15') }), // ~4 months → eligible
    ]
    expect(isFefoEligible(lots[0], NOW)).toBe(false)
    expect(isFefoEligible(lots[1], NOW)).toBe(true)
    const { allocations } = allocateFefo(lots, 5, NOW)
    expect(allocations.map((a) => a.lotId)).toEqual([2])
  })

  it('allocates across multiple lots and reports shortfall', () => {
    const lots = [
      lot({ id: 1, expDate: D('2027-01-01'), qtyAvailable: 4 }),
      lot({ id: 2, expDate: D('2027-02-01'), qtyAvailable: 3 }),
    ]
    const { allocations, shortfall } = allocateFefo(lots, 10, NOW)
    expect(allocations).toEqual([
      { lotId: 1, qty: 4, landedCostPerUnit: 100 },
      { lotId: 2, qty: 3, landedCostPerUnit: 100 },
    ])
    expect(shortfall).toBe(3)
  })

  it('getFefoLot returns the next shippable lot for PDP EXP', () => {
    const lots = [
      lot({ id: 1, expDate: D('2026-08-01') }), // blocked (near-expiry)
      lot({ id: 2, expDate: D('2028-01-01') }),
      lot({ id: 3, expDate: D('2027-06-01') }), // earliest eligible
    ]
    expect(getFefoLot(lots, NOW)?.id).toBe(3)
  })
})
