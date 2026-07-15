import type { CollectionConfig } from 'payload'

import { assignOrderNumber } from './hooks/orderNumber'

const opts = (...vals: string[]) => vals.map((v) => ({ label: v, value: v }))

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    group: 'Orders',
    defaultColumns: ['orderNumber', 'phone', 'grandTotal', 'codAmount', 'paymentStatus', 'fulfilmentStatus'],
  },
  hooks: { beforeChange: [assignOrderNumber] },
  fields: [
    { name: 'orderNumber', type: 'text', unique: true, index: true, admin: { readOnly: true } },
    { name: 'channel', type: 'select', defaultValue: 'web', options: opts('web', 'facebook', 'phone', 'walkIn') },
    { name: 'customer', type: 'relationship', relationTo: 'customers' },
    { name: 'phone', type: 'text', index: true },
    { name: 'email', type: 'text' },
    {
      name: 'items',
      type: 'array',
      admin: { description: 'Price + cost snapshots are mandatory — last month’s invoice must not change (§4.3).' },
      fields: [
        { name: 'variant', type: 'relationship', relationTo: 'variants' },
        { name: 'titleSnapshot', type: 'text' },
        { name: 'skuSnapshot', type: 'text' },
        { name: 'unitPriceSnapshot', type: 'number' },
        { name: 'qty', type: 'number' },
        { name: 'lineTotal', type: 'number' },
        { name: 'fulfilmentMode', type: 'text' },
        {
          name: 'lotAllocations',
          type: 'array',
          fields: [
            { name: 'lot', type: 'relationship', relationTo: 'stockLots' },
            { name: 'qty', type: 'number' },
            { name: 'landedCostSnapshot', type: 'number' },
          ],
        },
      ],
    },
    { name: 'orderType', type: 'select', options: opts('ready', 'preorder', 'mixed') },
    { name: 'subtotal', type: 'number' },
    { name: 'discountTotal', type: 'number', defaultValue: 0 },
    { name: 'deliveryCharge', type: 'number' },
    { name: 'grandTotal', type: 'number' },
    { name: 'advanceRequired', type: 'number', defaultValue: 0 },
    { name: 'advancePaid', type: 'number', defaultValue: 0 },
    {
      name: 'codAmount',
      type: 'number',
      admin: { description: 'What the courier collects (amount_to_collect) — never grandTotal (#2).' },
    },
    { name: 'paymentMethod', type: 'select', options: opts('cod', 'epsFull', 'epsAdvance') },
    {
      name: 'paymentStatus',
      type: 'select',
      defaultValue: 'unpaid',
      options: opts('unpaid', 'advancePaid', 'paid', 'refunded', 'partialRefund'),
    },
    {
      name: 'fulfilmentStatus',
      type: 'select',
      defaultValue: 'pending',
      index: true,
      options: opts('pending', 'confirmed', 'packed', 'handedToCourier', 'inTransit', 'delivered', 'returned', 'cancelled'),
    },
    { name: 'zone', type: 'select', options: opts('dhakaCity', 'dhakaSub', 'outside') },
    {
      name: 'shipping',
      type: 'group',
      fields: [
        { name: 'name', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'altPhone', type: 'text' },
        { name: 'address', type: 'textarea' },
        { name: 'cityId', type: 'text' },
        { name: 'zoneId', type: 'text' },
        { name: 'areaId', type: 'text' },
        { name: 'landmark', type: 'text' },
        { name: 'postcode', type: 'text' },
      ],
    },
    {
      // Populated in Phase 5 (courier push + fraud check).
      name: 'courier',
      type: 'group',
      fields: [
        { name: 'provider', type: 'select', options: opts('pathao', 'steadfast', 'manual') },
        { name: 'consignmentId', type: 'text' },
        { name: 'trackingCode', type: 'text' },
        { name: 'pushedAt', type: 'date' },
        { name: 'lastSyncAt', type: 'date' },
      ],
    },
    {
      name: 'attribution',
      type: 'group',
      admin: { description: 'fbp/fbc persisted here, not read from cookies at Purchase time (#8). eventIds for CAPI (Phase 6).' },
      fields: [
        { name: 'fbp', type: 'text' },
        { name: 'fbc', type: 'text' },
        { name: 'fbclid', type: 'text' },
        { name: 'utmSource', type: 'text' },
        { name: 'utmMedium', type: 'text' },
        { name: 'utmCampaign', type: 'text' },
        { name: 'clientIp', type: 'text' },
        { name: 'userAgent', type: 'text' },
        { name: 'landingPath', type: 'text' },
        { name: 'eventIds', type: 'json' },
      ],
    },
    {
      name: 'riskFlags',
      type: 'select',
      hasMany: true,
      options: opts('newCustomer', 'highValue', 'repeatCanceller', 'addressMismatch', 'inAppBrowser'),
    },
    {
      name: 'timeline',
      type: 'array',
      admin: { description: 'Append-only.' },
      fields: [
        { name: 'at', type: 'date' },
        { name: 'actor', type: 'text' },
        { name: 'event', type: 'text' },
        { name: 'note', type: 'text' },
      ],
    },
    { name: 'internalNotes', type: 'richText' },
  ],
}
