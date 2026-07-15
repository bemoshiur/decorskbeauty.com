import { randomBytes } from 'crypto'

import type { CollectionAfterChangeHook } from 'payload'

import { computeLandedCosts, type AllocationBasis, type POLineInput } from '@/lib/inventory/landedCost'

const idOf = (rel: unknown): number | null =>
  rel == null ? null : typeof rel === 'object' ? ((rel as { id?: number }).id ?? null) : (rel as number)

type POLine = {
  variant: unknown
  qty: number
  unitCostForeign: number
  lotCode?: string | null
  mfgDate?: string | null
  expDate?: string | null
}

/**
 * On status → received (§4.2): compute landed cost per line, create a stockLot per line, and a
 * `receipt` movement per lot (which drives qtyAvailable via recomputeStock). Idempotent: fires
 * once on the transition and no-ops if lots already exist for this PO.
 */
export const receivePurchaseOrder: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (!(doc.status === 'received' && previousDoc?.status !== 'received')) return doc
  const payload = req.payload

  const already = await payload.find({
    collection: 'stockLots',
    where: { purchaseOrder: { equals: doc.id } },
    limit: 1,
    depth: 0,
  })
  if (already.docs.length) return doc

  const lines = (doc.lines ?? []) as POLine[]
  if (!lines.length) return doc

  const variantIds = lines.map((l) => idOf(l.variant)).filter((x): x is number => x != null)
  const { docs: variants } = await payload.find({
    collection: 'variants',
    where: { id: { in: variantIds } },
    depth: 0,
    limit: 1000,
  })
  const weightById = new Map(variants.map((v) => [v.id, v.weightGrams ?? 0]))

  const inputs: POLineInput[] = lines.map((l) => ({
    qty: l.qty,
    unitCostForeign: l.unitCostForeign,
    weightGramsEach: weightById.get(idOf(l.variant) as number) ?? 0,
  }))

  const landed = computeLandedCosts(
    inputs,
    {
      freightBDT: doc.freightBDT ?? 0,
      dutyBDT: doc.dutyBDT ?? 0,
      vatAtImportBDT: doc.vatAtImportBDT ?? 0,
      clearingBDT: doc.clearingBDT ?? 0,
      otherChargesBDT: doc.otherChargesBDT ?? 0,
    },
    doc.fxRate ?? 1,
    (doc.allocationBasis as AllocationBasis) ?? 'byValue',
  )

  const now = new Date().toISOString()
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    const variantId = idOf(l.variant)
    if (!variantId || !(l.qty > 0)) continue

    const lot = await payload.create({
      collection: 'stockLots',
      req,
      overrideAccess: true,
      data: {
        variant: variantId,
        // Real lots use the code printed on the package; this fallback is non-guessable so
        // missing codes can't be enumerated via /verify.
        lotCode: l.lotCode || `${doc.poNumber}-${randomBytes(3).toString('hex').toUpperCase()}`,
        mfgDate: l.mfgDate ?? undefined,
        expDate: l.expDate ?? undefined,
        qtyReceived: l.qty,
        purchaseOrder: doc.id,
        landedCostPerUnit: landed[i].landedCostPerUnit,
        receivedAt: now,
        status: 'open',
      },
    })

    // qtyAvailable is set ONLY here, through the movement (non-negotiable #4).
    await payload.create({
      collection: 'stockMovements',
      req,
      overrideAccess: true,
      data: {
        lot: lot.id,
        variant: variantId,
        qty: l.qty,
        type: 'receipt',
        refType: 'purchaseOrder',
        refId: String(doc.id),
        at: now,
      },
    })
  }

  return doc
}
