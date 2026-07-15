import type { CollectionConfig } from 'payload'

import { accountingAccess } from '@/lib/auth/roles'
import { enforceJournalBalance } from './hooks/enforceJournalBalance'

const opts = (...vals: string[]) => vals.map((v) => ({ label: v, value: v }))

/**
 * A double-entry journal (§4.4). Balance and closed-period are enforced on the draft → posted
 * transition (enforceJournalBalance, #5/§12.6). Posted entries are corrected by voiding + reposting,
 * never by editing or deleting — a beforeDelete guard blocks hard-deleting a posted entry.
 */
export const JournalEntries: CollectionConfig = {
  slug: 'journalEntries',
  admin: { useAsTitle: 'ref', group: 'Accounting', defaultColumns: ['date', 'source', 'ref', 'status', 'memo'] },
  access: { read: accountingAccess, create: accountingAccess, update: accountingAccess, delete: accountingAccess },
  // Hard idempotency: one entry per (source, sourceId, ref). The writer's find-then-create is not
  // atomic — under an EPS reload or a webhook racing the reconciling cron, two writers can both pass
  // the find. This unique constraint makes the loser's INSERT fail instead of double-posting the ledger.
  indexes: [{ fields: ['source', 'sourceId', 'ref'], unique: true }],
  hooks: {
    beforeChange: [enforceJournalBalance],
    beforeDelete: [
      async ({ id, req }) => {
        const entry = await req.payload.findByID({ collection: 'journalEntries', id, depth: 0, overrideAccess: true, req })
        if (entry?.status === 'posted') throw new Error('A posted journal cannot be deleted — void it instead (§12 audit trail).')
      },
    ],
  },
  fields: [
    { name: 'date', type: 'date', required: true, index: true },
    { name: 'source', type: 'select', required: true, index: true, options: opts('order', 'purchaseOrder', 'courierPayout', 'epsSettlement', 'manual', 'systemClose') },
    { name: 'sourceId', type: 'text', index: true },
    { name: 'ref', type: 'text', index: true, admin: { description: 'Stable per (source,sourceId) — the idempotency + audit key, e.g. sale / cogs / po-receive.' } },
    { name: 'memo', type: 'text' },
    { name: 'status', type: 'select', defaultValue: 'draft', index: true, options: opts('draft', 'posted', 'void') },
    { name: 'postedBy', type: 'relationship', relationTo: 'users' },
    { name: 'postedAt', type: 'date' },
    { name: 'period', type: 'relationship', relationTo: 'fiscalPeriods' },
  ],
}
