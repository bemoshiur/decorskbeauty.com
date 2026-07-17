import type { CollectionConfig } from 'payload'

import { slugField } from '@/fields/slug'
import { seoField } from '@/fields/seo'
import { revalidateCatalogAfterChange, revalidateCatalogAfterDelete } from '@/lib/commerce/revalidate'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    group: 'Catalog',
    defaultColumns: ['name', 'parent', 'slug'],
  },
  access: { read: () => true },
  hooks: {
    afterChange: [revalidateCatalogAfterChange],
    afterDelete: [revalidateCatalogAfterDelete],
  },
  fields: [
    // Display name is English (was localized in the spec; English-only build).
    { name: 'name', type: 'text', required: true },
    // Slug stays Latin + unlocalized (§4.1 rationale).
    slugField('name'),
    { name: 'parent', type: 'relationship', relationTo: 'categories' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'description', type: 'richText' },
    // ---- Homepage merchandising (§ redesign 2026-07-17) ----
    { name: 'featuredOnHome', type: 'checkbox', defaultValue: false, admin: { description: 'Show in the homepage category grid.' } },
    { name: 'homeOrder', type: 'number', defaultValue: 0, admin: { description: 'Lower shows first in the category grid.' } },
    { name: 'tileImage', type: 'upload', relationTo: 'media', admin: { description: 'Optional dedicated image for the homepage tile (falls back to `image`).' } },
    {
      name: 'accent',
      type: 'select',
      defaultValue: 'celadon',
      options: [
        { label: 'Celadon', value: 'celadon' },
        { label: 'Sky', value: 'sky' },
        { label: 'Apricot', value: 'apricot' },
        { label: 'Rose', value: 'rose-clay' },
        { label: 'Lilac', value: 'lilac' },
      ],
      admin: { description: 'Tile accent colour.' },
    },
    seoField,
  ],
}
