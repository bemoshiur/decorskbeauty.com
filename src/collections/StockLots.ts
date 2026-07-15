import type { CollectionConfig } from 'payload'

import { costFieldRead } from '@/lib/auth/roles'

/**
 * The batch — the authenticity spine (§4.2). Powers the PDP EXP, the authenticity slip and /verify.
 * Quantities are read-only: maintained only by the stock-movement hook (non-negotiable #4).
 */
export const StockLots: CollectionConfig = {
  slug: 'stockLots',
  admin: {
    useAsTitle: 'lotCode',
    group: 'Inventory',
    defaultColumns: ['lotCode', 'variant', 'expDate', 'qtyAvailable', 'status'],
  },
  // Staff-only: lots carry landedCostPerUnit (COGS) + PO refs. The public /verify and PDP read
  // through lib/commerce with overrideAccess and project only the safe fields — never the REST API.
  access: { read: ({ req }) => Boolean(req.user) },
  indexes: [{ fields: ['lotCode'] }],
  fields: [
    { name: 'variant', type: 'relationship', relationTo: 'variants', required: true },
    { name: 'lotCode', type: 'text', required: true, index: true, admin: { description: 'The code printed on the package.' } },
    { name: 'mfgDate', type: 'date' },
    { name: 'expDate', type: 'date', index: true },
    { name: 'qtyReceived', type: 'number', defaultValue: 0 },
    { name: 'qtyAvailable', type: 'number', defaultValue: 0, admin: { readOnly: true, description: 'Maintained ONLY by the stock-movement hook (#4).' } },
    { name: 'qtyReserved', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'qtyDamaged', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'purchaseOrder', type: 'relationship', relationTo: 'purchaseOrders' },
    {
      name: 'landedCostPerUnit',
      type: 'number',
      // COGS — invisible to packer/support (§4.6). Field-level, so the admin API strips it; the
      // storefront + internal services read with overrideAccess and are unaffected.
      access: { read: costFieldRead },
      admin: { readOnly: true, description: 'Set at receive. Drives COGS. Hidden from packer/support (RBAC §4.6).' },
    },
    { name: 'receivedAt', type: 'date' },
    {
      name: 'shortExpiry',
      type: 'checkbox',
      defaultValue: false,
      admin: { readOnly: true, description: '3–6 months to EXP — set by the daily expiry cron (§10.3). Badge + clearance band. <3mo is FEFO-skipped by date.' },
    },
    {
      name: 'importDocs',
      type: 'array',
      admin: { description: 'Invoice, BL, customs release, brand authorization — surfaced on /verify.' },
      fields: [
        { name: 'doc', type: 'upload', relationTo: 'media', required: true },
        { name: 'label', type: 'text' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      options: ['open', 'depleted', 'quarantined', 'expired'].map((v) => ({ label: v, value: v })),
    },
  ],
}
