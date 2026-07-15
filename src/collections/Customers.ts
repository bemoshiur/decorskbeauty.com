import type { CollectionConfig } from 'payload'

/** Phone is the primary key of customer identity (§4.3), not email. */
export const Customers: CollectionConfig = {
  slug: 'customers',
  admin: { useAsTitle: 'phone', group: 'Orders', defaultColumns: ['phone', 'name', 'orderCount', 'blacklisted'] },
  fields: [
    { name: 'phone', type: 'text', required: true, unique: true, index: true },
    { name: 'name', type: 'text' },
    { name: 'email', type: 'text' },
    {
      name: 'addresses',
      type: 'array',
      fields: [
        { name: 'address', type: 'textarea' },
        { name: 'zone', type: 'select', options: ['dhakaCity', 'dhakaSub', 'outside'] },
        { name: 'landmark', type: 'text' },
      ],
    },
    // Counters maintained by order/fulfilment hooks (Phase 5). Default 0.
    { name: 'orderCount', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'deliveredCount', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'cancelledCount', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'lifetimeValue', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'blacklisted', type: 'checkbox', defaultValue: false },
    { name: 'blacklistReason', type: 'text' },
  ],
}
