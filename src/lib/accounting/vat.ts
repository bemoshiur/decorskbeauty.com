import type { Payload, PayloadRequest } from 'payload'

import { round2 } from '@/lib/inventory/landedCost'

/**
 * The output VAT contained in a product subtotal, read from the `settings` global (§12.4). Returns 0
 * until a rate is configured — the ONLY place a rate is read (never hardcode one, #§12.4). Treated as
 * VAT-inclusive (carve-out) so grandTotal is unaffected; the exclusive branch is left for when the
 * consultant confirms the model and checkout starts adding VAT on top.
 */
export async function vatOnSubtotal(payload: Payload, subtotal: number, req?: PayloadRequest): Promise<number> {
  const settings = await payload.findGlobal({ slug: 'settings', overrideAccess: true, req }).catch(() => null)
  const rate = Number(settings?.vatRatePercent ?? 0)
  if (!(rate > 0) || !(subtotal > 0)) return 0
  const inclusive = settings?.vatInclusive !== false // default to inclusive carve-out
  return inclusive ? round2((subtotal * rate) / (100 + rate)) : round2((subtotal * rate) / 100)
}
