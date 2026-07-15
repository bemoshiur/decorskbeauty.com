import type { CollectionConfig } from 'payload'

import { inventoryAccess, costFieldRead } from '@/lib/auth/roles'
import { receivePurchaseOrder } from './hooks/receivePurchaseOrder'

/**
 * The import (§4.2). On status → received, a hook computes landed cost and creates stockLots +
 * receipt movements. Long receives (>200 lines) belong in a cron route (§2.1) — not built yet.
 * Buying data is inventory-role only (§4.6) — packer/support never see supplier costs.
 */
export const PurchaseOrders: CollectionConfig = {
  slug: 'purchaseOrders',
  admin: {
    useAsTitle: 'poNumber',
    group: 'Inventory',
    defaultColumns: ['poNumber', 'supplier', 'currency', 'status'],
  },
  access: { read: inventoryAccess, create: inventoryAccess, update: inventoryAccess, delete: inventoryAccess },
  hooks: { afterChange: [receivePurchaseOrder] },
  fields: [
    { name: 'poNumber', type: 'text', required: true, index: true },
    { name: 'supplier', type: 'relationship', relationTo: 'suppliers' },
    {
      name: 'currency',
      type: 'select',
      defaultValue: 'KRW',
      options: [
        { label: 'KRW', value: 'KRW' },
        { label: 'USD', value: 'USD' },
      ],
    },
    { name: 'fxRate', type: 'number', required: true, admin: { description: 'Foreign → BDT.' } },
    {
      name: 'lines',
      type: 'array',
      admin: { description: 'Intake per line: variant, qty, unit cost (foreign) + the lot printed on the package.' },
      fields: [
        { name: 'variant', type: 'relationship', relationTo: 'variants', required: true },
        { name: 'qty', type: 'number', required: true },
        { name: 'unitCostForeign', type: 'number', required: true, access: { read: costFieldRead } },
        { name: 'lotCode', type: 'text' },
        { name: 'mfgDate', type: 'date' },
        { name: 'expDate', type: 'date' },
      ],
    },
    { name: 'freightBDT', type: 'number', defaultValue: 0 },
    { name: 'dutyBDT', type: 'number', defaultValue: 0 },
    { name: 'vatAtImportBDT', type: 'number', defaultValue: 0 },
    { name: 'clearingBDT', type: 'number', defaultValue: 0 },
    { name: 'otherChargesBDT', type: 'number', defaultValue: 0 },
    {
      name: 'allocationBasis',
      type: 'select',
      defaultValue: 'byValue',
      options: [
        { label: 'By value', value: 'byValue' },
        { label: 'By weight', value: 'byWeight' },
        { label: 'By quantity', value: 'byQty' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: ['draft', 'ordered', 'inTransit', 'customs', 'received', 'closed'].map((v) => ({ label: v, value: v })),
    },
  ],
}
