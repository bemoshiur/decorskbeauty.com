import { unstable_cache } from 'next/cache'

import type { Payload, Where } from 'payload'
import type { Review } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { CATALOG_TAG } from './tags'

/** Public-safe review shape. Deliberately omits authorPhone — the storefront never sees it (#13 boundary). */
export type ReviewCard = {
  id: number
  rating: number
  title: string | null
  body: string
  authorName: string
  verifiedPurchase: boolean
  createdAt: string
}

export type RatingKey = 1 | 2 | 3 | 4 | 5
export type ReviewSummary = {
  count: number
  average: number // one decimal place
  distribution: Record<RatingKey, number>
}

export const EMPTY_SUMMARY: ReviewSummary = {
  count: 0,
  average: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
}

const clampStar = (n: number): RatingKey => Math.max(1, Math.min(5, Math.round(n))) as RatingKey

const toCard = (r: Review): ReviewCard => ({
  id: r.id,
  rating: clampStar(r.rating),
  title: r.title ?? null,
  body: r.body,
  authorName: r.authorName,
  verifiedPurchase: Boolean(r.verifiedPurchase),
  createdAt: r.createdAt,
})

/** Pure aggregation over a set of star ratings. Exported for tests. */
export function summarize(ratings: number[]): ReviewSummary {
  const distribution: Record<RatingKey, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let sum = 0
  for (const raw of ratings) {
    const star = clampStar(raw)
    distribution[star] += 1
    sum += star
  }
  const count = ratings.length
  const average = count ? Math.round((sum / count) * 10) / 10 : 0
  return { count, average, distribution }
}

const approvedFor = (productId: number): Where => ({
  and: [{ product: { equals: productId } }, { status: { equals: 'approved' } }],
})

/**
 * Approved reviews for a product, newest first, as phone-free DTOs. Never throws (returns [] on error) so
 * a reviews outage can never blank a product page.
 */
export const listApprovedReviews = (productId: number, limit = 24): Promise<ReviewCard[]> =>
  unstable_cache(
    async () => {
      try {
        const payload = await getPayloadClient()
        const res = await payload.find({
          collection: 'reviews',
          where: approvedFor(productId),
          sort: '-createdAt',
          depth: 0,
          limit,
          overrideAccess: true,
        })
        return (res.docs as Review[]).map(toCard)
      } catch {
        return []
      }
    },
    ['reviews', 'list', String(productId), String(limit)],
    { tags: [CATALOG_TAG], revalidate: 300 },
  )()

/**
 * Aggregate of a product's APPROVED reviews. This is the only input to AggregateRating (#12) — an empty
 * result means no rating is emitted, never a seeded one.
 */
export const getReviewSummary = (productId: number): Promise<ReviewSummary> =>
  unstable_cache(
    async () => {
      try {
        const payload = await getPayloadClient()
        const res = await payload.find({
          collection: 'reviews',
          where: approvedFor(productId),
          depth: 0,
          limit: 1000,
          overrideAccess: true,
          pagination: false,
        })
        return summarize((res.docs as Review[]).map((r) => r.rating))
      } catch {
        return EMPTY_SUMMARY
      }
    },
    ['reviews', 'summary', String(productId)],
    { tags: [CATALOG_TAG], revalidate: 300 },
  )()

/**
 * True when this phone has a genuine order for the product — a delivered order (COD received) or a paid
 * order (EPS). Used by the submission API to set `verifiedPurchase`. Best-effort: any failure → false, so
 * the review is still accepted, just without the badge.
 */
export async function hasPurchasedProduct(payload: Payload, phone: string, skus: string[]): Promise<boolean> {
  if (!phone || skus.length === 0) return false
  try {
    const res = await payload.count({
      collection: 'orders',
      where: {
        and: [
          { phone: { equals: phone } },
          { 'items.skuSnapshot': { in: skus } },
          {
            or: [
              { fulfilmentStatus: { equals: 'delivered' } },
              { paymentStatus: { in: ['paid', 'advancePaid'] } },
            ],
          },
        ],
      },
      overrideAccess: true,
    })
    return res.totalDocs > 0
  } catch {
    return false
  }
}
