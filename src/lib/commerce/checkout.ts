/**
 * The ONLY place delivery / advance / COD numbers exist (non-negotiable #3). No magic numbers
 * for these anywhere else. Encodes §1.1 exactly.
 *
 * Rule order (§1.1):
 *   1. grandTotal > ৳5,000        → 30% of grandTotal advance (supersedes the flat outside ৳200;
 *                                    take the HIGHER, never both). ">৳5,000" is on grandTotal
 *                                    incl. delivery (owner decision, 2026-07-15).
 *   2. subtotal (after discount) ≥ ৳4,999 → delivery = ৳0 (measured before delivery).
 *   3. any pre-order line          → whole order 100% advance, no COD (supersedes 1 & 2 for the
 *                                    advance; free shipping still applies).
 *   4. advance is always collected via EPS. No partial-COD-plus-cash-advance path.
 */
export type Zone = 'dhakaCity' | 'dhakaSub' | 'outside'

export const DELIVERY_CHARGE: Record<Zone, number> = {
  dhakaCity: 80,
  dhakaSub: 110,
  outside: 140,
}
export const FREE_SHIPPING_MIN_SUBTOTAL = 4999 // measured on subtotal after discount
export const OUTSIDE_ADVANCE = 200
export const HIGH_VALUE_THRESHOLD = 5000 // grandTotal strictly greater than
export const HIGH_VALUE_ADVANCE_RATE = 0.3

export const ZONE_LABEL: Record<Zone, string> = {
  dhakaCity: 'Dhaka City',
  dhakaSub: 'Dhaka Sub-urban',
  outside: 'Outside Dhaka',
}

export type CartLineForTerms = { unitPrice: number; qty: number; isPreOrder?: boolean }
export type CartForTerms = { lines: CartLineForTerms[]; discountTotal?: number }

export type CheckoutTerms = {
  subtotal: number
  deliveryCharge: number
  grandTotal: number
  advanceRequired: number
  codAmount: number
  codAllowed: boolean
  reason: string[]
}

const bdt = (n: number) => `৳${n.toLocaleString('en-US')}`

export function computeCheckoutTerms(cart: CartForTerms, zone: Zone): CheckoutTerms {
  const gross = cart.lines.reduce((s, l) => s + l.unitPrice * l.qty, 0)
  const discount = Math.max(0, cart.discountTotal ?? 0)
  const subtotal = Math.max(0, gross - discount)
  const hasPreOrder = cart.lines.some((l) => l.isPreOrder === true)
  const reason: string[] = []

  // Rule 2 — free shipping on subtotal (still applies even with a pre-order line).
  const freeShipping = subtotal >= FREE_SHIPPING_MIN_SUBTOTAL
  const deliveryCharge = freeShipping ? 0 : DELIVERY_CHARGE[zone]
  reason.push(
    freeShipping
      ? `Free delivery on orders over ${bdt(FREE_SHIPPING_MIN_SUBTOTAL)}.`
      : `Delivery to ${ZONE_LABEL[zone]}: ${bdt(deliveryCharge)}.`,
  )

  const grandTotal = subtotal + deliveryCharge

  // Advance.
  let advanceRequired = 0
  if (hasPreOrder) {
    // Rule 3 — supersedes rules 1 & 2 for the advance.
    advanceRequired = grandTotal
    reason.push('Pre-order items require full advance payment — no cash on delivery.')
  } else {
    // Rule 1 — take the HIGHER of the flat outside advance and 30% of grandTotal, never both.
    const flatOutside = zone === 'outside' ? OUTSIDE_ADVANCE : 0
    const highValue = grandTotal > HIGH_VALUE_THRESHOLD ? Math.round(grandTotal * HIGH_VALUE_ADVANCE_RATE) : 0
    advanceRequired = Math.max(flatOutside, highValue)
    if (advanceRequired > 0) {
      reason.push(
        highValue >= flatOutside && highValue > 0
          ? `Orders over ${bdt(HIGH_VALUE_THRESHOLD)} need a 30% advance (${bdt(advanceRequired)}).`
          : `${ZONE_LABEL.outside} needs a ${bdt(OUTSIDE_ADVANCE)} advance.`,
      )
    }
  }

  const codAmount = Math.max(0, grandTotal - advanceRequired)
  const codAllowed = !hasPreOrder
  if (advanceRequired > 0 && codAllowed) {
    reason.push('The advance is paid online; the rest is cash on delivery.')
  }

  return { subtotal, deliveryCharge, grandTotal, advanceRequired, codAmount, codAllowed, reason }
}
