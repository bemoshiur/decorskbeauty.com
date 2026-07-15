import type { CollectionConfig } from 'payload'

export const Suppliers: CollectionConfig = {
  slug: 'suppliers',
  admin: { useAsTitle: 'name', group: 'Inventory', defaultColumns: ['name', 'country', 'defaultCurrency'] },
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
