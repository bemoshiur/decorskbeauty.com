import type { CollectionConfig } from 'payload'

/**
 * Variants are a SEPARATE collection, not an array on products — at 1,500 SKUs x size x shade
 * an array field will not survive (§4.1 / CLAUDE.md trap).
 */
export const Variants: CollectionConfig = {
  slug: 'variants',
  admin: {
    useAsTitle: 'sku',
    group: 'Catalog',
    defaultColumns: ['sku', 'product', 'mrp', 'availableQty', 'active'],
  },
  access: { read: () => true },
  fields: [
    { name: 'product', type: 'relationship', relationTo: 'products', required: true },
    {
      name: 'sku',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          'THE identity spine (non-negotiable #1). Byte-identical in Meta catalog id, Pixel content_ids, CAPI contents[].id, Google feed id. Never change once live.',
      },
    },
    { name: 'optionSize', type: 'text', admin: { placeholder: '50ml' } },
    { name: 'optionShade', type: 'text', admin: { placeholder: '21 Light Beige' } },
    { name: 'optionBundle', type: 'text', admin: { placeholder: 'Pack of 2' } },
    { name: 'barcode', type: 'text' },
    { name: 'mrp', type: 'number', required: true, admin: { description: 'Regular price, BDT.' } },
    { name: 'salePrice', type: 'number' },
    { name: 'saleStart', type: 'date' },
    { name: 'saleEnd', type: 'date' },
    {
      name: 'weightGrams',
      type: 'number',
      required: true,
      admin: { description: 'Required — Pathao rejects orders without weight.' },
    },
    { name: 'preOrderLeadDays', type: 'number', defaultValue: 15 },
    { name: 'image', type: 'upload', relationTo: 'media', admin: { description: 'Variant-specific shot (e.g. shade swatch).' } },
    { name: 'active', type: 'checkbox', defaultValue: true },
    {
      name: 'availableQty',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description:
          'Denormalized. Maintained ONLY by the stock-movement hook (Phase 2, non-negotiable #4). Never write directly.',
      },
    },
  ],
}
