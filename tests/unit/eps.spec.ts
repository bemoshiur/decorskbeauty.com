import { describe, it, expect } from 'vitest'
import crypto from 'node:crypto'

import { normalizeStatus, epsHash, generateMerchantTransactionId } from '@/lib/integrations/eps/client'

describe('EPS status normalizer (§8.1 aliases)', () => {
  it('maps all documented + observed aliases', () => {
    expect(normalizeStatus({ Status: 'Success' })).toBe('SUCCESS')
    expect(normalizeStatus({ transactionStatus: 'COMPLETED' })).toBe('SUCCESS')
    expect(normalizeStatus({ status: 'FAILURE' })).toBe('FAILED')
    expect(normalizeStatus({ Status: 'Failed' })).toBe('FAILED')
    expect(normalizeStatus({ status: 'CANCEL' })).toBe('CANCELLED')
    expect(normalizeStatus({ Status: 'Cancelled' })).toBe('CANCELLED')
    expect(normalizeStatus({ data: { transactionStatus: 'canceled' } })).toBe('CANCELLED')
    expect(normalizeStatus({ data: { status: 'Pending' } })).toBe('PENDING')
    expect(normalizeStatus({})).toBe('UNKNOWN')
    expect(normalizeStatus(null)).toBe('UNKNOWN')
  })

  it('handles mixed casing', () => {
    expect(normalizeStatus({ Status: 'sUcCeSs' })).toBe('SUCCESS')
  })

  it('prefers Status over the nested aliases', () => {
    expect(normalizeStatus({ Status: 'Success', data: { status: 'Failed' } })).toBe('SUCCESS')
  })
})

describe('EPS x-hash', () => {
  it('is HMAC-SHA512(key, message) base64 (88 chars)', () => {
    const h = epsHash('TXN-123', 'my-hash-key')
    expect(h).toHaveLength(88)
    expect(h).toBe(crypto.createHmac('sha512', 'my-hash-key').update('TXN-123', 'utf8').digest('base64'))
  })
  it('is deterministic and parameter-sensitive', () => {
    expect(epsHash('a', 'k')).toBe(epsHash('a', 'k'))
    expect(epsHash('a', 'k')).not.toBe(epsHash('b', 'k'))
  })
  it('key and message are not interchangeable', () => {
    expect(epsHash('param', 'key')).not.toBe(epsHash('key', 'param'))
  })
})

describe('merchantTransactionId', () => {
  it('is unique and ≥ 10 chars with the TXN- prefix', () => {
    const a = generateMerchantTransactionId()
    const b = generateMerchantTransactionId()
    expect(a).not.toBe(b)
    expect(a.length).toBeGreaterThanOrEqual(10)
    expect(a.startsWith('TXN-')).toBe(true)
  })
})
