import type { CollectionConfig } from 'payload'

import { staffOnly } from './access/staff'

/**
 * EPS settlement reconciliation (§4.4 / §12.5). Match by merchant transaction ID, show variance,
 * post the settlement journal (postEpsSettles) on accept. Never auto-post with a variance. Upload/
 * match UI is Phase 7-deferred; the shape + posting fn exist so it plugs in.
 */
export const EpsSettlements: CollectionConfig = {
  slug: 'epsSettlements',
  admin: { useAsTitle: 'id', group: 'Accounting', defaultColumns: ['periodStart', 'periodEnd', 'netReceived', 'variance', 'status'] },
  access: { read: staffOnly, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    { name: 'periodStart', type: 'date' },
    { name: 'periodEnd', type: 'date' },
    {
      name: 'transactions',
      type: 'array',
      fields: [
        { name: 'merchantTransactionId', type: 'text' },
        { name: 'transaction', type: 'relationship', relationTo: 'transactions' },
        { name: 'gross', type: 'number', defaultValue: 0 },
        { name: 'mdr', type: 'number', defaultValue: 0 },
        { name: 'matched', type: 'checkbox', defaultValue: false },
      ],
    },
    { name: 'gross', type: 'number', defaultValue: 0 },
    { name: 'mdr', type: 'number', defaultValue: 0 },
    { name: 'netReceived', type: 'number', defaultValue: 0 },
    { name: 'variance', type: 'number', defaultValue: 0, admin: { description: 'Statement vs ledger. Never auto-post a non-zero variance (§12.5).' } },
    { name: 'reconciledAt', type: 'date' },
    { name: 'status', type: 'select', defaultValue: 'pending', options: ['pending', 'reconciled'].map((v) => ({ label: v, value: v })) },
  ],
}
