import { describe, it, expect } from 'vitest'
import { orderConfirmationBody } from '@/lib/commerce/notifications'

// GSM-7 is 160 chars/segment; a single non-GSM char (e.g. ৳) flips the whole message to 70-char
// unicode segments, ~3x the cost. These guard the order-confirmation template against both.
const isGsm7Safe = (s: string) => !/[^\x00-\x7F]/.test(s)

describe('order-confirmation SMS template', () => {
  it('COD body: ASCII/GSM-7 safe and one segment (≤160)', () => {
    const body = orderConfirmationBody({ id: 12345, orderNumber: 'DKB-2607-00001', codAmount: 1760 })
    expect(isGsm7Safe(body)).toBe(true)
    expect(body).not.toMatch(/৳/)
    expect(body.length).toBeLessThanOrEqual(160)
  })

  it('prepaid body: ASCII/GSM-7 safe and one segment (≤160)', () => {
    const body = orderConfirmationBody({ id: 12345, orderNumber: 'DKB-2607-99999', codAmount: 0 })
    expect(isGsm7Safe(body)).toBe(true)
    expect(body.length).toBeLessThanOrEqual(160)
  })

  it('large COD amount stays within budget', () => {
    const body = orderConfirmationBody({ id: 1, orderNumber: 'DKB-2607-00001', codAmount: 99999 })
    expect(isGsm7Safe(body)).toBe(true)
    expect(body.length).toBeLessThanOrEqual(160)
  })

  it('falls back to an order id when orderNumber is missing', () => {
    const body = orderConfirmationBody({ id: 42, codAmount: 500 })
    expect(body).toContain('Order 42')
    expect(isGsm7Safe(body)).toBe(true)
  })
})
