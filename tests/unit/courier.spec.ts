import { describe, it, expect } from 'vitest'

import { buildPathaoOrder, buildSteadfastOrder, clampWeightKg, type CourierOrderInput } from '@/lib/integrations/courier/payloads'
import { normalizeCourierStatus } from '@/lib/commerce/courierWebhook'

// Outside-Dhaka order: grandTotal 640, ৳200 advance paid online → codAmount 440.
const order: CourierOrderInput = {
  orderNumber: 'DKB-2607-00042',
  codAmount: 440,
  recipientName: 'Test Buyer',
  recipientPhone: '01700000001',
  recipientAddress: 'House 1, Road 1, Rajshahi — at least ten chars',
  cityId: 1,
  zoneId: 2,
  areaId: 3,
  weightKg: 0.2,
  itemQuantity: 2,
}

describe('courier payloads — amount_to_collect is codAmount, never grandTotal (#2, acceptance #2)', () => {
  it('Pathao amount_to_collect === codAmount', () => {
    const p = buildPathaoOrder(order, 'store-1')
    expect(p.amount_to_collect).toBe(440)
    expect(p.amount_to_collect).not.toBe(640) // never grandTotal
    expect(p.merchant_order_id).toBe('DKB-2607-00042')
    expect(p.item_type).toBe(2)
    expect(p.delivery_type).toBe(48)
  })

  it('Steadfast cod_amount === codAmount', () => {
    const s = buildSteadfastOrder(order)
    expect(s.cod_amount).toBe(440)
    expect(s.cod_amount).not.toBe(640)
    expect(s.invoice).toBe('DKB-2607-00042')
  })

  it('clamps weight to Pathao’s 0.5kg minimum', () => {
    expect(clampWeightKg(0.2)).toBe(0.5)
    expect(clampWeightKg(1.234)).toBe(1.23)
    expect(buildPathaoOrder(order, 's').item_weight).toBe(0.5)
  })
})

describe('courier status normalization (§9.4)', () => {
  it('maps varied courier strings', () => {
    expect(normalizeCourierStatus('Delivered')).toBe('delivered')
    expect(normalizeCourierStatus('delivered_approval_pending')).toBe('delivered')
    expect(normalizeCourierStatus('Delivery_failed')).toBe('other')
    expect(normalizeCourierStatus('Return')).toBe('returned')
    expect(normalizeCourierStatus('partial_delivered')).toBe('delivered')
    expect(normalizeCourierStatus('cancelled')).toBe('returned')
    expect(normalizeCourierStatus('In_Transit')).toBe('inTransit')
    expect(normalizeCourierStatus('picked')).toBe('inTransit')
    expect(normalizeCourierStatus('')).toBe('other')
  })
})
