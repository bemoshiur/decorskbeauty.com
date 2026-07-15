import type { CollectionConfig } from 'payload'

import { slugField } from '@/fields/slug'
import { seoField } from '@/fields/seo'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    group: 'Catalog',
    defaultColumns: ['name', 'parent', 'slug'],
  },
  access: { read: () => true },
  fields: [
    // Display name is English (was localized in the spec; English-only build).
    { name: 'name', type: 'text', required: true },
    // Slug stays Latin + unlocalized (§4.1 rationale).
    slugField('name'),
    { name: 'parent', type: 'relationship', relationTo: 'categories' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'description', type: 'richText' },
    seoField,
  ],
}
