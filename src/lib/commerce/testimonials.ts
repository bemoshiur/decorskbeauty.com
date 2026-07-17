import { unstable_cache } from 'next/cache'

import type { Where } from 'payload'
import type { Testimonial } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { CONTENT_TAG } from './tags'

/**
 * Approved testimonials for the storefront (marketing social proof ONLY — never AggregateRating, #12).
 * `featuredOnly` restricts to the homepage set. Ordered by `order`, then newest.
 */
export const listApprovedTestimonials = (opts: { featuredOnly?: boolean; limit?: number } = {}): Promise<Testimonial[]> => {
  const { featuredOnly = false, limit = 12 } = opts
  return unstable_cache(
    async () => {
      try {
        const payload = await getPayloadClient()
        const where: Where = featuredOnly
          ? { and: [{ approved: { equals: true } }, { featured: { equals: true } }] }
          : { approved: { equals: true } }
        const res = await payload.find({ collection: 'testimonials', where, sort: 'order', depth: 1, limit, overrideAccess: true })
        return res.docs as Testimonial[]
      } catch {
        return []
      }
    },
    ['testimonials', featuredOnly ? 'featured' : 'all', String(limit)],
    { tags: [CONTENT_TAG], revalidate: 300 },
  )()
}
