import type { Field } from 'payload'

/** Reusable SEO group (§4.1). English-only build, so not localized. */
export const seoField: Field = {
  name: 'seo',
  type: 'group',
  admin: { description: 'Search/social metadata. Falls back to title + short description if blank.' },
  fields: [
    { name: 'metaTitle', type: 'text' },
    { name: 'metaDescription', type: 'textarea' },
    { name: 'ogImage', type: 'upload', relationTo: 'media' },
  ],
}
