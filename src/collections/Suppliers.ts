import type { CollectionConfig } from 'payload'

import { inventoryAccess } from '@/lib/auth/roles'

export const Suppliers: CollectionConfig = {
  slug: 'suppliers',
  admin: { useAsTitle: 'name', group: 'Inventory', defaultColumns: ['name', 'country', 'defaultCurrency'] },
  access: { read: inventoryAccess, create: inventoryAccess, update: inventoryAccess, delete: inventoryAccess },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'country', type: 'text', defaultValue: 'South Korea' },
    { name: 'contact', type: 'text' },
    {
      name: 'defaultCurrency',
      type: 'select',
      defaultValue: 'KRW',
      options: [
        { label: 'KRW', value: 'KRW' },
        { label: 'USD', value: 'USD' },
      ],
    },
    { name: 'notes', type: 'textarea' },
  ],
}
