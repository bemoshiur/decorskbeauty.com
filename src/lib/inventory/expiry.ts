import type { Payload } from 'payload'

import { round2 } from './landedCost'
import { postJournal, postWriteOff } from '@/lib/accounting'

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000

const relId = (rel: unknown): number | null =>
  rel == null ? null : typeof rel === 'object' ? ((rel as { id?: number }).id ?? null) : (rel as number)

export type ExpiryScanResult = { scanned: number; expired: number; shortFlagged: number; writeOffValue: number }

/**
 * Near-expiry scan (§10.3). Past EXP → status `expired`, remaining stock removed via an
 * `expiryWriteoff` movement (#4) and written off to 5020 with a balanced journal (#5 — a decision,
 * not an accident). 3–6 months → flag `shortExpiry`. <3 months is already FEFO-skipped by date.
 * Pure of HTTP/auth so it can be unit-driven; `nowMs` injected for testability.
 */
export async function runExpiryScan(payload: Payload, nowMs: number): Promise<ExpiryScanResult> {
  const { docs } = await payload.find({
    collection: 'stockLots',
    where: { status: { in: ['open', 'depleted'] } },
    limit: 5000,
    depth: 0,
    overrideAccess: true,
  })

  let expired = 0
  let shortFlagged = 0
  let writeOffValue = 0
  for (const lot of docs) {
    if (!lot.expDate) continue
    const exp = Date.parse(lot.expDate as string)
    if (Number.isNaN(exp)) continue

    if (exp <= nowMs) {
      const qty = lot.qtyAvailable ?? 0
      const variantId = relId(lot.variant)
      if (qty > 0 && variantId) {
        await payload.create({
          collection: 'stockMovements',
          overrideAccess: true,
          data: { lot: lot.id, variant: variantId, qty: -qty, type: 'expiryWriteoff', refType: 'lot', refId: `expiry-${lot.id}`, at: new Date().toISOString() },
        })
        const value = round2(qty * (lot.landedCostPerUnit ?? 0))
        if (value > 0) {
          await postJournal(payload, {
            source: 'manual',
            sourceId: `lot-${lot.id}`,
            ref: 'writeoff-expiry',
            memo: `Expiry write-off — lot ${lot.lotCode} (${qty} units @ ${lot.landedCostPerUnit})`,
            lines: postWriteOff({ amount: value }),
          })
          writeOffValue = round2(writeOffValue + value)
        }
      }
      await payload.update({ collection: 'stockLots', id: lot.id, overrideAccess: true, data: { status: 'expired' } })
      expired++
    } else if (exp - nowMs <= SIX_MONTHS_MS && !lot.shortExpiry) {
      await payload.update({ collection: 'stockLots', id: lot.id, overrideAccess: true, data: { shortExpiry: true } })
      shortFlagged++
    }
  }
  return { scanned: docs.length, expired, shortFlagged, writeOffValue }
}
