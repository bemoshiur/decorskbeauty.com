import type { GlobalConfig } from 'payload'

import { homepageBlocks } from '../blocks/homepage'
import { seoField } from '../fields/seo'
import { revalidateContentGlobal } from '../lib/commerce/revalidate'

/**
 * The landing page, built by the owner from orderable blocks (§ redesign 2026-07-17). Read on the
 * storefront through src/lib/commerce/content.ts::getHomepage (never the Local API directly, #13).
 * Editing here revalidates the CONTENT cache tag so changes go live without a deploy.
 */
export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Homepage',
  admin: { group: 'Content', description: 'Add, remove and reorder the landing-page sections.' },
  access: { read: () => true, update: ({ req }) => Boolean(req.user) },
  hooks: { afterChange: [revalidateContentGlobal] },
  fields: [
    {
      name: 'layout',
      type: 'blocks',
      blocks: homepageBlocks,
      admin: { initCollapsed: true, description: 'The homepage renders these top-to-bottom.' },
    },
    seoField,
  ],
}
