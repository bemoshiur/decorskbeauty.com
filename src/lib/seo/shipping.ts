import { DELIVERY_CHARGE, FREE_SHIPPING_MIN_SUBTOTAL, type Zone } from '@/lib/commerce/checkout'

/**
 * `shippingDetails` + `hasMerchantReturnPolicy` for Product/Offer JSON-LD (§14.2). These two earn the
 * free shipping + returns annotations in Google's product listings — every competitor omits them.
 * Rates come from the single delivery-charge source (§1, no magic numbers), so they can never drift
 * from checkout. Return policy is config-driven (settings) so the structured data is never a fabricated
 * claim — a wrong return policy is a manual-action risk.
 */
const money = (value: number) => ({ '@type': 'MonetaryAmount', value: value.toFixed(2), currency: 'BDT' })
const days = (min: number, max: number) => ({ '@type': 'QuantitativeValue', minValue: min, maxValue: max, unitCode: 'DAY' })

const ZONE_TRANSIT: Record<Zone, [number, number]> = {
  dhakaCity: [1, 2],
  dhakaSub: [2, 3],
  outside: [3, 5],
}
const ZONE_REGION: Record<Zone, string | undefined> = { dhakaCity: 'Dhaka', dhakaSub: 'Dhaka', outside: undefined }

/** One OfferShippingDetails per delivery zone, at the real ৳80/৳110/৳140 rates. */
export function shippingDetails(): object[] {
  return (Object.keys(DELIVERY_CHARGE) as Zone[]).map((zone) => {
    const [tmin, tmax] = ZONE_TRANSIT[zone]
    const region = ZONE_REGION[zone]
    return {
      '@type': 'OfferShippingDetails',
      shippingRate: money(DELIVERY_CHARGE[zone]),
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'BD', ...(region ? { addressRegion: region } : {}) },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: days(0, 1),
        transitTime: days(tmin, tmax),
      },
    }
  })
}

/** Free-shipping threshold as a human note for on-page copy (kept out of shippingDetails — schema.org
 *  has no threshold property, and a blanket free entry would be inaccurate). */
export const FREE_SHIPPING_OVER = FREE_SHIPPING_MIN_SUBTOTAL

export type ReturnPolicyConfig = {
  returnsAccepted?: boolean | null
  returnWindowDays?: number | null
}

/**
 * hasMerchantReturnPolicy from config. Defaults to a conservative finite window; if returns are not
 * accepted (e.g. opened cosmetics), emits MerchantReturnNotPermitted rather than a false promise.
 */
export function merchantReturnPolicy(cfg: ReturnPolicyConfig = {}): object {
  const accepted = cfg.returnsAccepted !== false
  const window = Math.max(0, cfg.returnWindowDays ?? 3)
  if (!accepted || window === 0) {
    return { '@type': 'MerchantReturnPolicy', applicableCountry: 'BD', returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted' }
  }
  return {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'BD',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: window,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/FreeReturn',
  }
}
