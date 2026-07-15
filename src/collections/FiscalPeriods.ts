import type { CollectionConfig } from 'payload'

import { accountingAccess } from '@/lib/auth/roles'

/**
 * Monthly fiscal period (§4.4 / §12.6). Posting into a closed month is rejected (enforced in the
 * journal writer and the entry balance hook). Closing produces the trial balance / P&L / balance
 * sheet snapshots — the close job itself is Phase 7-deferred (period-close report UI).
 */
export const FiscalPeriods: CollectionConfig = {
  slug: 'fiscalPeriods',
  admin: { useAsTitle: 'month', group: 'Accounting', defaultColumns: ['month', 'status', 'closedAt'] },
  access: { read: accountingAccess, create: accountingAccess, update: accountingAccess, delete: accountingAccess },
  fields: [
    { name: 'month', type: 'text', required: true, unique: true, index: true, admin: { description: 'YYYY-MM.' } },
    { name: 'status', type: 'select', defaultValue: 'open', options: ['open', 'closed'].map((v) => ({ label: v, value: v })) },
    { name: 'closedAt', type: 'date' },
    { name: 'closedBy', type: 'relationship', relationTo: 'users' },
  ],
}
