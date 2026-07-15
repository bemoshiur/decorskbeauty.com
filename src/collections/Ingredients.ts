import type { CollectionConfig } from 'payload'

import { slugField } from '@/fields/slug'
import { seoField } from '@/fields/seo'

/**
 * Ingredient glossary — the AEO surface (§4.1, §14.3). One clear definitional answer.
 * `nameLocalized` from the spec is dropped (English-only build).
 */
export const Ingredients: CollectionConfig = {
  slug: 'ingredients',
  admin: {
    useAsTitle: 'name',
    group: 'Catalog',
    defaultColumns: ['name', 'slug'],
  },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'definition', type: 'richText' },
    { name: 'benefits', type: 'textarea' },
    { name: 'cautions', type: 'textarea' },
    seoField,
  ],
}
