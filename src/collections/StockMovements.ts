import type { CollectionConfig } from 'payload'

import { recomputeStockFromMovement } from './hooks/recomputeStock'

/**
 * Immutable, append-only stock ledger (§4.2). The ONLY write path to lot/variant quantities
 * (non-negotiable #4). Never updated or deleted.
 */
export const StockMovements: CollectionConfig = {
  slug: 'stockMovements',
  admin: {
    useAsTitle: 'id',
    group: 'Inventory',
    defaultColumns: ['type', 'variant', 'lot', 'qty', 'refType', 'at'],
  },
  access: {
    update: () => false,
    delete: () => false,
  },
  hooks: {
    afterChange: [recomputeStockFromMovement],
  },
  fields: [
    { name: 'lot', type: 'relationship', relationTo: 'stockLots' },
    { name: 'variant', type: 'relationship', relationTo: 'variants', required: true },
    { name: 'qty', type: 'number', required: true, admin: { description: 'Signed. + adds to available, − removes.' } },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: ['receipt', 'reserve', 'release', 'ship', 'returnRestock', 'damage', 'adjustment', 'expiryWriteoff'].map(
        (v) => ({ label: v, value: v }),
      ),
    },
    { name: 'refType', type: 'text', admin: { description: 'e.g. purchaseOrder, order, return' } },
    { name: 'refId', type: 'text' },
    { name: 'actor', type: 'relationship', relationTo: 'users' },
    { name: 'at', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
  ],
}
