import { describe, it, expect } from 'vitest'

import { summarize, EMPTY_SUMMARY } from '@/lib/commerce/reviews'

describe('review summary aggregation (#12 — only ever from real ratings)', () => {
  it('empty set → count 0, average 0 (so no AggregateRating is ever emitted)', () => {
    const s = summarize([])
    expect(s).toEqual(EMPTY_SUMMARY)
    expect(s.count).toBe(0)
    expect(s.average).toBe(0)
  })

  it('averages to one decimal place and buckets the distribution', () => {
    const s = summarize([5, 5, 4, 3, 5]) // 22 / 5 = 4.4
    expect(s.count).toBe(5)
    expect(s.average).toBe(4.4)
    expect(s.distribution[5]).toBe(3)
    expect(s.distribution[4]).toBe(1)
    expect(s.distribution[3]).toBe(1)
    expect(s.distribution[2]).toBe(0)
    expect(s.distribution[1]).toBe(0)
  })

  it('clamps and rounds out-of-range ratings into 1..5 buckets', () => {
    const s = summarize([0, 6, 3.4, 4.6]) // → 1, 5, 3, 5
    expect(s.count).toBe(4)
    expect(s.distribution[1]).toBe(1)
    expect(s.distribution[3]).toBe(1)
    expect(s.distribution[5]).toBe(2)
  })

  it('a single 5-star review averages exactly 5.0', () => {
    expect(summarize([5]).average).toBe(5)
  })
})
