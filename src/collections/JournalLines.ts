import type { CollectionConfig, PayloadRequest } from 'payload'

import { round2 } from '@/lib/inventory/landedCost'
import { staffOnly } from './access/staff'

const idOf = (rel: unknown): number | null => (rel == null ? null : typeof rel === 'object' ? ((rel as { id?: number }).id ?? null) : (rel as number))

/** A posted entry's legs are immutable — corrections go through void + repost, never by editing the
 *  lines directly. This closes the balance-guard bypass: enforceJournalBalance only fires on the
 *  ENTRY, so without this a staff user could unbalance a posted journal by editing/deleting a leg (#5).
 *  Draft (writer building the entry) and void (excluded from the ledger) legs stay mutable. */
async function assertParentNotPosted(entryRel: unknown, req: PayloadRequest) {
  const entryId = idOf(entryRel)
  if (!entryId) return
  const entry = await req.payload.findByID({ collection: 'journalEntries', id: entryId, depth: 0, overrideAccess: true, req }).catch(() => null)
  if (entry?.status === 'posted') throw new Error('This journal is posted — its lines are immutable. Void the entry and repost to correct it (§12, #5).')
}

/**
 * A single leg of a journal (§4.4). Exactly one of debit/credit is non-zero and non-negative —
 * enforced per line here; the entry-level balance (Σdebit === Σcredit) is enforced on the parent
 * (enforceJournalBalance). orderRef/poRef carry the sub-ledger link for reports.
 */
export const JournalLines: CollectionConfig = {
  slug: 'journalLines',
  admin: { useAsTitle: 'id', group: 'Accounting', defaultColumns: ['entry', 'account', 'debit', 'credit'] },
  access: { read: staffOnly, create: staffOnly, update: staffOnly, delete: staffOnly },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        await assertParentNotPosted(originalDoc?.entry ?? data.entry, req)
        const d = round2(data.debit ?? 0)
        const c = round2(data.credit ?? 0)
        if (d < 0 || c < 0) throw new Error('A journal line amount cannot be negative.')
        if (d !== 0 && c !== 0) throw new Error('A journal line has exactly one of debit or credit non-zero.')
        if (d === 0 && c === 0) throw new Error('A journal line needs a debit or a credit.')
        return data
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const line = await req.payload.findByID({ collection: 'journalLines', id, depth: 0, overrideAccess: true, req }).catch(() => null)
        if (line) await assertParentNotPosted(line.entry, req)
      },
    ],
  },
  fields: [
    { name: 'entry', type: 'relationship', relationTo: 'journalEntries', required: true, index: true },
    { name: 'account', type: 'relationship', relationTo: 'accounts', required: true, index: true },
    { name: 'debit', type: 'number', defaultValue: 0 },
    { name: 'credit', type: 'number', defaultValue: 0 },
    { name: 'orderRef', type: 'text', index: true },
    { name: 'poRef', type: 'text', index: true },
  ],
}
