/**
 * FEFO allocation (§10.1). Earliest expDate first, then earliest receivedAt as tiebreak.
 * Skips quarantined/expired lots, empty lots, and lots inside the near-expiry block window
 * (< ~3 months to EXP, §10.3). Pure — `nowMs` is injected for testability.
 */
export type LotStatus = 'open' | 'depleted' | 'quarantined' | 'expired'

export type AllocatableLot = {
  id: number | string
  expDate: string // ISO
  receivedAt: string // ISO
  qtyAvailable: number
  landedCostPerUnit: number
  status: LotStatus
}

export type Allocation = { lotId: number | string; qty: number; landedCostPerUnit: number }

/** ~3 months, the near-expiry block window (§10.3). */
export const NEAR_EXPIRY_MS = 90 * 24 * 60 * 60 * 1000

export function isFefoEligible(lot: AllocatableLot, nowMs: number): boolean {
  if (lot.status === 'quarantined' || lot.status === 'expired') return false
  if (!(lot.qtyAvailable > 0)) return false
  const exp = Date.parse(lot.expDate)
  if (Number.isNaN(exp)) return false
  // Block anything expired or inside the <3-month window.
  return exp - nowMs >= NEAR_EXPIRY_MS
}

const fefoSort = (a: AllocatableLot, b: AllocatableLot): number =>
  Date.parse(a.expDate) - Date.parse(b.expDate) || Date.parse(a.receivedAt) - Date.parse(b.receivedAt)

export function eligibleLotsFefo(lots: AllocatableLot[], nowMs: number): AllocatableLot[] {
  return lots.filter((l) => isFefoEligible(l, nowMs)).sort(fefoSort)
}

/** The lot FEFO would ship next — used for the PDP EXP + authenticity slip (§10.2). */
export function getFefoLot(lots: AllocatableLot[], nowMs: number): AllocatableLot | null {
  return eligibleLotsFefo(lots, nowMs)[0] ?? null
}

export function allocateFefo(
  lots: AllocatableLot[],
  qty: number,
  nowMs: number,
): { allocations: Allocation[]; shortfall: number } {
  const allocations: Allocation[] = []
  let remaining = qty
  for (const lot of eligibleLotsFefo(lots, nowMs)) {
    if (remaining <= 0) break
    const take = Math.min(remaining, lot.qtyAvailable)
    if (take <= 0) continue
    allocations.push({ lotId: lot.id, qty: take, landedCostPerUnit: lot.landedCostPerUnit })
    remaining -= take
  }
  return { allocations, shortfall: Math.max(0, remaining) }
}
