import type { CollectionConfig } from 'payload'

/** EPS transactions (§4.3). merchantTransactionId is the idempotency key (§8.3). */
export const Transactions: CollectionConfig = {
  slug: 'transactions',
  admin: {
    useAsTitle: 'merchantTransactionId',
    group: 'Orders',
    defaultColumns: ['merchantTransactionId', 'order', 'amount', 'purpose', 'status'],
  },
  fields: [
    { name: 'order', type: 'relationship', relationTo: 'orders' },
    { name: 'merchantTransactionId', type: 'text', required: true, unique: true, index: true },
    { name: 'epsTransactionId', type: 'text' },
    { name: 'amount', type: 'number' },
    { name: 'purpose', type: 'select', options: [{ label: 'advance', value: 'advance' }, { label: 'full', value: 'full' }] },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: ['pending', 'success', 'failed', 'cancelled', 'unknown'].map((v) => ({ label: v, value: v })),
    },
    { name: 'rawInit', type: 'json' },
    { name: 'rawVerify', type: 'json' },
    { name: 'verifiedAt', type: 'date' },
    { name: 'financialEntity', type: 'text' },
  ],
}
