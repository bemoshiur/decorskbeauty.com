import type { CollectionConfig } from 'payload'

import { slugField } from '@/fields/slug'
import { seoField } from '@/fields/seo'
import { revalidateCatalogAfterChange, revalidateCatalogAfterDelete } from '@/lib/commerce/revalidate'

export const PRODUCT_TYPES = [
  'cleanser',
  'toner',
  'essence',
  'serum',
  'ampoule',
  'moisturizer',
  'sunscreen',
  'mask',
  'exfoliator',
  'eyeCream',
  'shampoo',
  'conditioner',
  'hairTreatment',
  'tool',
  'set',
] as const

export const SKIN_TYPES = ['dry', 'oily', 'combination', 'sensitive', 'normal', 'acneProne'] as const

export const CONCERNS = [
  'acne',
  'pigmentation',
  'dullness',
  'aging',
  'pores',
  'redness',
  'hairfall',
  'dandruff',
  'frizz',
] as const

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    group: 'Catalog',
    defaultColumns: ['title', 'brand', 'productType', 'fulfilmentMode', '_status'],
  },
  access: { read: () => true },
  versions: { drafts: true }, // provides _status draft/published (§4.1)
  hooks: {
    afterChange: [revalidateCatalogAfterChange],
    afterDelete: [revalidateCatalogAfterDelete],
  },
  fields: [
    // Title is ALWAYS English, never localized (locked business rule / non-negotiable #10).
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    { name: 'brand', type: 'relationship', relationTo: 'brands' },
    { name: 'categories', type: 'relationship', relationTo: 'categories', hasMany: true },
    { name: 'shortDescription', type: 'textarea' },
    { name: 'description', type: 'richText' },
    { name: 'howToUse', type: 'richText' },
    { name: 'inci', type: 'textarea', admin: { description: 'Full INCI list, verbatim from packaging (EN).' } },
    { name: 'keyIngredients', type: 'relationship', relationTo: 'ingredients', hasMany: true },
    {
      name: 'productType',
      type: 'select',
      options: PRODUCT_TYPES.map((v) => ({ label: v, value: v })),
    },
    {
      name: 'routineStep',
      type: 'number',
      min: 1,
      max: 6,
      admin: { description: 'Powers the routine builder. Null for haircare and tools.' },
    },
    {
      name: 'skinTypes',
      type: 'select',
      hasMany: true,
      options: SKIN_TYPES.map((v) => ({ label: v, value: v })),
    },
    {
      name: 'concerns',
      type: 'select',
      hasMany: true,
      options: CONCERNS.map((v) => ({ label: v, value: v })),
    },
    {
      name: 'images',
      type: 'array',
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'alt', type: 'text' },
      ],
    },
    {
      name: 'fulfilmentMode',
      type: 'select',
      defaultValue: 'readyStock',
      options: [
        { label: 'Ready stock', value: 'readyStock' },
        { label: 'Pre-order', value: 'preOrder' },
        { label: 'Both', value: 'both' },
      ],
    },
    {
      name: 'faq',
      type: 'array',
      admin: { description: 'Powers FAQPage JSON-LD (§14.2). Minimum 3 per PDP (§14.3).' },
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
    // ---- Merchandising (§ redesign 2026-07-17): admin control over homepage/PDP surfacing ----
    {
      type: 'collapsible',
      label: 'Merchandising',
      admin: { initCollapsed: true, description: 'Controls how this product is featured on the storefront.' },
      fields: [
        { name: 'isBestSeller', type: 'checkbox', defaultValue: false, admin: { description: 'Show in the best-sellers section.' } },
        { name: 'isNew', type: 'checkbox', defaultValue: false, admin: { description: 'Adds a "New" badge.' } },
        { name: 'featuredRank', type: 'number', admin: { description: 'Lower ranks first in featured/best-seller auto-fill. Leave blank to exclude from auto-fill.' } },
        {
          name: 'homeBadge',
          type: 'select',
          options: [
            { label: '— none —', value: 'none' },
            { label: 'Best seller', value: 'bestseller' },
            { label: 'New', value: 'new' },
            { label: 'Sale', value: 'sale' },
            { label: 'Limited', value: 'limited' },
          ],
          defaultValue: 'none',
          admin: { description: 'Badge shown on product cards.' },
        },
        {
          name: 'highlights',
          type: 'array',
          maxRows: 5,
          labels: { singular: 'Highlight', plural: 'Highlights' },
          admin: { description: 'Short USP bullets shown on the PDP.' },
          fields: [{ name: 'text', type: 'text', required: true }],
        },
        {
          name: 'crossSell',
          type: 'relationship',
          relationTo: 'products',
          hasMany: true,
          admin: { description: 'Curated "you may also like" products (falls back to auto-related when empty).' },
        },
      ],
    },
    seoField,
  ],
}
