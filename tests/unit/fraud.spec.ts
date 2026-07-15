import { describe, it, expect } from 'vitest'

import { decideFraud } from '@/lib/integrations/fraud'

describe('fraud decision policy (§7.1)', () => {
  it('prepaid (advance) orders always pass — no RTO risk', () => {
    expect(decideFraud({ successRatio: 0.1, blacklisted: true, isCod: false })).toBe('pass')
  })
  it('COD: ≥80% or no history → pass', () => {
    expect(decideFraud({ successRatio: 0.8, blacklisted: false, isCod: true })).toBe('pass')
    expect(decideFraud({ successRatio: 0.95, blacklisted: false, isCod: true })).toBe('pass')
    expect(decideFraud({ successRatio: null, blacklisted: false, isCod: true })).toBe('pass')
  })
  it('COD: 50–79% → review', () => {
    expect(decideFraud({ successRatio: 0.5, blacklisted: false, isCod: true })).toBe('review')
    expect(decideFraud({ successRatio: 0.79, blacklisted: false, isCod: true })).toBe('review')
  })
  it('COD: <50% → block (force advance)', () => {
    expect(decideFraud({ successRatio: 0.49, blacklisted: false, isCod: true })).toBe('block')
    expect(decideFraud({ successRatio: 0, blacklisted: false, isCod: true })).toBe('block')
  })
  it('COD + blacklisted → block', () => {
    expect(decideFraud({ successRatio: 0.99, blacklisted: true, isCod: true })).toBe('block')
  })
})
