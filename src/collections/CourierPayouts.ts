import type { CollectionConfig } from 'payload'

import { staffOnly } from './access/staff'

/**
 * Courier COD payout reconciliation (§4.4 / §12.5). Paste/upload the provider statement, match by
 * consignment ID, show variance, post the payout journal on accept. Never auto-post with a variance;
 * unmatched rows stay pending. The upload/match UI is Phase 7-deferred — the shape + posting fn
 * (postCourierRemitsCod) exist so it plugs in.
 */
export const CourierPayouts: CollectionConfig = {
  slug: 'courierPayouts',
  admin: { useAsTitle: 'id', group: 'Accounting', defaultColumns: ['provider', 'periodStart', 'periodEnd', 'netReceived', 'variance', 'status'] },
  access: { read: staffOnly, create: staffOnly, update: staffOnly, delete: staffOnly },
  fields: [
    { name: 'provider', type: 'select', options: ['pathao', 'steadfast'].map((v) => ({ label: v, value: v })) },
    { name: 'periodStart', type: 'date' },
    { name: 'periodEnd', type: 'date' },
    {
      name: 'consignments',
      type: 'array',
      fields: [
        { name: 'consignmentId', type: 'text' },
        // Named orderLink (not `order`) — a plain `order` field collides with Payload's internal
        // array `_order` index.
        { name: 'orderLink', type: 'relationship', relationTo: 'orders' },
        { name: 'codCollected', type: 'number', defaultValue: 0 },
        { name: 'courierFee', type: 'number', defaultValue: 0 },
        { name: 'rtoFee', type: 'number', defaultValue: 0 },
        { name: 'matched', type: 'checkbox', defaultValue: false },
      ],
    },
    { name: 'codCollected', type: 'number', defaultValue: 0 },
    { name: 'courierFee', type: 'number', defaultValue: 0 },
    { name: 'rtoFee', type: 'number', defaultValue: 0 },
    { name: 'netReceived', type: 'number', defaultValue: 0 },
    { name: 'variance', type: 'number', defaultValue: 0, admin: { description: 'Statement vs ledger. Never auto-post a non-zero variance (§12.5).' } },
    { name: 'reconciledAt', type: 'date' },
    { name: 'status', type: 'select', defaultValue: 'pending', options: ['pending', 'reconciled'].map((v) => ({ label: v, value: v })) },
  ],
}
