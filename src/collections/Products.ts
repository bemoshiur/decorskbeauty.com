import type { CollectionConfig } from 'payload'

import { slugField } from '@/fields/slug'
import { seoField } from '@/fields/seo'

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
    seoField,
  ],
}
