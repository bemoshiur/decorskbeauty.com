/**
 * Landed cost (§4.2). This number drives COGS forever — get it right.
 *
 *   lineForeignCost   = qty × unitCostForeign
 *   lineBDTCost       = lineForeignCost × fxRate
 *   overheadPool      = freight + duty + vatAtImport + clearing + other
 *   allocationWeight  = per basis (value | weight | qty)
 *   lineOverheadShare = overheadPool × (lineWeight / totalWeight)
 *   landedCostPerUnit = (lineBDTCost + lineOverheadShare) / qty
 *
 * Rounded to 4 decimals internally, 2 for display.
 */
export type AllocationBasis = 'byValue' | 'byWeight' | 'byQty'

export type POLineInput = {
  qty: number
  unitCostForeign: number
  /** Per-unit weight in grams (variants.weightGrams). Only used for byWeight. */
  weightGramsEach: number
}

export type Overheads = {
  freightBDT: number
  dutyBDT: number
  vatAtImportBDT: number
  clearingBDT: number
  otherChargesBDT: number
}

export type LandedLine = {
  lineBDTCost: number
  lineOverheadShare: number
  landedCostPerUnit: number
}

export const round4 = (n: number): number => Math.round((n + Number.EPSILON) * 10000) / 10000
export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100

export function computeLandedCosts(
  lines: POLineInput[],
  overheads: Overheads,
  fxRate: number,
  basis: AllocationBasis = 'byValue',
): LandedLine[] {
  const overheadPool =
    (overheads.freightBDT || 0) +
    (overheads.dutyBDT || 0) +
    (overheads.vatAtImportBDT || 0) +
    (overheads.clearingBDT || 0) +
    (overheads.otherChargesBDT || 0)

  const computed = lines.map((l) => {
    const lineBDTCost = l.qty * l.unitCostForeign * fxRate
    const weight =
      basis === 'byWeight' ? (l.weightGramsEach || 0) * l.qty : basis === 'byQty' ? l.qty : lineBDTCost
    return { lineBDTCost, weight }
  })

  const totalWeight = computed.reduce((s, c) => s + c.weight, 0)

  return lines.map((l, i) => {
    const { lineBDTCost, weight } = computed[i]
    const lineOverheadShare = totalWeight > 0 ? overheadPool * (weight / totalWeight) : 0
    const landedCostPerUnit = l.qty > 0 ? (lineBDTCost + lineOverheadShare) / l.qty : 0
    return {
      lineBDTCost: round4(lineBDTCost),
      lineOverheadShare: round4(lineOverheadShare),
      landedCostPerUnit: round4(landedCostPerUnit),
    }
  })
}
