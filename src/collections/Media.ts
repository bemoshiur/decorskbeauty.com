import type { CollectionConfig } from 'payload'

import { generateBlurDataURL } from './hooks/generateBlurDataURL'

/**
 * Media pipeline (§15.4). Responsive AVIF+WebP set pre-generated ONCE on upload; the storefront
 * serves those URLs directly (unoptimized) — never a per-viewport per-visitor transform.
 * With S3_BUCKET the plugin puts these on S3 (served via the /api/media/file proxy); otherwise local disk.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  access: { read: () => true },
  admin: { group: 'Catalog' },
  hooks: { beforeChange: [generateBlurDataURL] },
  fields: [
    { name: 'alt', type: 'text' },
    { name: 'blurDataURL', type: 'text', admin: { readOnly: true, hidden: true } },
  ],
  upload: {
    mimeTypes: ['image/*'],
    focalPoint: false,
    // Source cap per §15.4: max 1200px long edge.
    resizeOptions: { width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true },
    formatOptions: { format: 'webp', options: { quality: 72 } },
    imageSizes: [
      { name: 'thumb', width: 400, formatOptions: { format: 'webp', options: { quality: 72 } } },
      { name: 'card', width: 800, formatOptions: { format: 'webp', options: { quality: 72 } } },
      { name: 'hero', width: 1200, formatOptions: { format: 'webp', options: { quality: 72 } } },
      { name: 'thumb_avif', width: 400, formatOptions: { format: 'avif', options: { quality: 55 } } },
      { name: 'card_avif', width: 800, formatOptions: { format: 'avif', options: { quality: 55 } } },
      { name: 'hero_avif', width: 1200, formatOptions: { format: 'avif', options: { quality: 55 } } },
    ],
  },
}
