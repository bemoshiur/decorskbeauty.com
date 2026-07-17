import { unstable_cache } from 'next/cache'

import type { SiteSetting, Homepage, Category } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { CONTENT_TAG } from './tags'

/**
 * Admin-managed marketing content, read the ONLY sanctioned way — through lib/commerce (#13), cached
 * under the CONTENT tag (busted by the globals'/collections' afterChange hooks). Every reader degrades
 * to null/[] so the storefront never crashes on an empty/unsaved global.
 */

/** Store-wide chrome + copy (header, footer, announcement, identity, delivery/PDP copy). */
export const getSiteSettings = (): Promise<SiteSetting | null> =>
  unstable_cache(
    async () => {
      try {
        const payload = await getPayloadClient()
        return (await payload.findGlobal({ slug: 'site-settings', depth: 2, overrideAccess: true })) as SiteSetting
      } catch {
        return null
      }
    },
    ['site-settings'],
    { tags: [CONTENT_TAG], revalidate: 300 },
  )()

/** The homepage layout (ordered blocks) + home SEO. */
export const getHomepage = (): Promise<Homepage | null> =>
  unstable_cache(
    async () => {
      try {
        const payload = await getPayloadClient()
        return (await payload.findGlobal({ slug: 'homepage', depth: 2, overrideAccess: true })) as Homepage
      } catch {
        return null
      }
    },
    ['homepage'],
    { tags: [CONTENT_TAG], revalidate: 300 },
  )()

/** Categories the owner flagged for the homepage grid, ordered. Falls back to [] (component decides). */
export const listFeaturedCategories = (limit = 6): Promise<Category[]> =>
  unstable_cache(
    async () => {
      try {
        const payload = await getPayloadClient()
        const res = await payload.find({
          collection: 'categories',
          where: { featuredOnHome: { equals: true } },
          sort: 'homeOrder',
          depth: 1,
          limit,
          overrideAccess: true,
        })
        return res.docs as Category[]
      } catch {
        return []
      }
    },
    ['featured-categories', String(limit)],
    { tags: [CONTENT_TAG], revalidate: 300 },
  )()
