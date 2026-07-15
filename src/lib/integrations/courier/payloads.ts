/**
 * Pure courier payload builders (§9.1, §9.2). `amount_to_collect` / `cod_amount` are ALWAYS the
 * order's codAmount, NEVER grandTotal — the single most dangerous field in the build (#2). Tested.
 */
export type CourierOrderInput = {
  orderNumber: string
  codAmount: number
  recipientName: string
  recipientPhone: string
  recipientAddress: string
  cityId?: string | number | null
  zoneId?: string | number | null
  areaId?: string | number | null
  weightKg: number
  itemQuantity: number
  itemDescription?: string
  specialInstruction?: string
  deliveryType?: 'normal' | 'onDemand'
}

export const PATHAO_DELIVERY = { normal: 48, onDemand: 12 } as const
export const PATHAO_ITEM_TYPE_PARCEL = 2

/** Pathao rejects orders under 0.5 kg; round to 2dp. */
export const clampWeightKg = (kg: number): number => Math.max(0.5, Math.round((kg || 0) * 100) / 100)

export function buildPathaoOrder(o: CourierOrderInput, storeId: string) {
  return {
    store_id: storeId,
    merchant_order_id: o.orderNumber,
    recipient_name: o.recipientName,
    recipient_phone: o.recipientPhone,
    recipient_address: o.recipientAddress,
    recipient_city: o.cityId,
    recipient_zone: o.zoneId,
    recipient_area: o.areaId,
    delivery_type: o.deliveryType === 'onDemand' ? PATHAO_DELIVERY.onDemand : PATHAO_DELIVERY.normal,
    item_type: PATHAO_ITEM_TYPE_PARCEL,
    item_quantity: o.itemQuantity,
    item_weight: clampWeightKg(o.weightKg),
    amount_to_collect: o.codAmount, // === orders.codAmount, never grandTotal (#2)
    item_description: o.itemDescription ?? `Order ${o.orderNumber}`,
    special_instruction: o.specialInstruction ?? '',
  }
}

export function buildSteadfastOrder(o: CourierOrderInput) {
  return {
    invoice: o.orderNumber,
    recipient_name: o.recipientName,
    recipient_phone: o.recipientPhone,
    recipient_address: o.recipientAddress,
    cod_amount: o.codAmount, // === orders.codAmount, never grandTotal (#2)
    note: o.specialInstruction ?? '',
    delivery_type: 0, // 0 = home delivery
  }
}
