import type { CollectionConfig } from 'payload'

/**
 * Server-side cart (§4.3), keyed by an HttpOnly cookie. Holds no stock (reservation happens at
 * order confirmation, §10.1). `attribution` is carried to the order for CAPI (Phase 6).
 * `customer` relation is added with the customers collection in Phase 4.
 */
export const Carts: CollectionConfig = {
  slug: 'carts',
  admin: { useAsTitle: 'token', group: 'System', defaultColumns: ['token', 'phone', 'updatedAt'] },
  fields: [
    { name: 'token', type: 'text', required: true, index: true, unique: true },
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'variant', type: 'relationship', relationTo: 'variants', required: true },
        { name: 'qty', type: 'number', required: true, defaultValue: 1, min: 1 },
      ],
    },
    { name: 'phone', type: 'text' },
    {
      name: 'attribution',
      type: 'group',
      admin: { description: 'First-touch attribution — carried to the order for CAPI (Phase 6).' },
      fields: [
        { name: 'fbp', type: 'text' },
        { name: 'fbc', type: 'text' },
        { name: 'fbclid', type: 'text' },
        { name: 'utmSource', type: 'text' },
        { name: 'utmMedium', type: 'text' },
        { name: 'utmCampaign', type: 'text' },
        { name: 'landingPath', type: 'text' },
      ],
    },
    { name: 'expiresAt', type: 'date' },
  ],
}
