import type { CollectionConfig } from 'payload'

const opts = (...v: string[]) => v.map((x) => ({ label: x, value: x }))

/** Returns / RTO (§4.3). Restocking writes a returnRestock movement to the original lot (#12). */
export const Returns: CollectionConfig = {
  slug: 'returns',
  admin: { useAsTitle: 'id', group: 'Orders', defaultColumns: ['order', 'type', 'condition', 'status'] },
  fields: [
    { name: 'order', type: 'relationship', relationTo: 'orders' },
    { name: 'type', type: 'select', options: opts('rto', 'customerReturn') },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'variant', type: 'relationship', relationTo: 'variants' },
        { name: 'qty', type: 'number' },
        { name: 'condition', type: 'select', options: opts('resellable', 'damaged') },
      ],
    },
    { name: 'reason', type: 'text' },
    { name: 'condition', type: 'select', options: opts('resellable', 'damaged') },
    { name: 'restockLot', type: 'relationship', relationTo: 'stockLots' },
    { name: 'refundAmount', type: 'number' },
    { name: 'refundMethod', type: 'text' },
    { name: 'status', type: 'select', defaultValue: 'open', options: opts('open', 'processed', 'closed') },
  ],
}
