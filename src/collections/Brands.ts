import type { CollectionConfig } from 'payload'

import { slugField } from '@/fields/slug'
import { seoField } from '@/fields/seo'
import { revalidateCatalogAfterChange, revalidateCatalogAfterDelete } from '@/lib/commerce/revalidate'

export const Brands: CollectionConfig = {
  slug: 'brands',
  admin: {
    useAsTitle: 'name',
    group: 'Catalog',
    defaultColumns: ['name', 'countryOfOrigin', 'slug'],
  },
  access: { read: () => true },
  hooks: {
    afterChange: [revalidateCatalogAfterChange],
    afterDelete: [revalidateCatalogAfterDelete],
  },
  fields: [
    // EN, never localized (§4.1)
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'countryOfOrigin', type: 'text', defaultValue: 'South Korea' },
    { name: 'story', type: 'richText' },
    seoField,
  ],
}
