import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import type { Product, Variant } from '@/payload-types'
import { normalizeMsisdn } from '@/lib/integrations/sms'
import { hasPurchasedProduct } from '@/lib/commerce/reviews'

// Reviews are always moderated (created as `pending`), so these caps only guard the DB from flooding.
const RATE_PER_IP_PER_DAY = 15

const bad = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status })

/**
 * Public review submission. Always forces status=pending (owner moderates in admin before anything shows —
 * #12: real, approved reviews only). Sets verifiedPurchase when the phone matches a delivered/paid order
 * for this product. Never trusts a client-supplied product id — resolves the product from its slug.
 *
 * Path note: this lives at /api/reviews/SUBMIT, not /api/reviews, on purpose. The `reviews` collection's
 * Payload REST endpoint is /api/reviews; an exact Next route there would shadow Payload's catch-all and
 * break the admin's list/moderation. /api/reviews/submit only shadows the (never-real) id "submit".
 */
export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as {
    slug?: string
    rating?: number | string
    title?: string
    body?: string
    authorName?: string
    phone?: string
  }

  const slug = typeof b.slug === 'string' ? b.slug.trim() : ''
  const rating = Number(b.rating)
  const body = typeof b.body === 'string' ? b.body.trim() : ''
  const authorName = typeof b.authorName === 'string' ? b.authorName.trim().slice(0, 80) : ''
  const title = typeof b.title === 'string' ? b.title.trim().slice(0, 120) : ''

  if (!slug) return bad('Something went wrong — please reload the page and try again.')
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return bad('Choose a rating from 1 to 5 stars.')
  if (authorName.length < 2) return bad('Please add your name.')
  if (body.length < 10) return bad('Please write at least a sentence about the product.')
  if (body.length > 2000) return bad('Please keep your review under 2000 characters.')

  const msisdn = typeof b.phone === 'string' && b.phone ? normalizeMsisdn(b.phone) : ''
  const phoneValid = /^8801\d{9}$/.test(msisdn)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  const payload = await getPayload({ config })

  // Resolve product from slug (must be published) — never trust a client id.
  const prod = await payload.find({
    collection: 'products',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const product = prod.docs[0] as Product | undefined
  if (!product) return bad('Product not found.', 404)

  const dayAgo = new Date(Date.now() - 86_400_000).toISOString()

  // Abuse guard: cap submissions per IP per day.
  const byIp = await payload.count({
    collection: 'reviews',
    where: { and: [{ authorIp: { equals: ip } }, { createdAt: { greater_than: dayAgo } }] },
    overrideAccess: true,
  })
  if (byIp.totalDocs >= RATE_PER_IP_PER_DAY) {
    return bad('Thanks — you have submitted several reviews today. Please try again tomorrow.', 429)
  }

  // One review per phone per product (prevents duplicate/repeat submissions from the same customer).
  if (phoneValid) {
    const dupe = await payload.count({
      collection: 'reviews',
      where: { and: [{ product: { equals: product.id } }, { authorPhone: { equals: msisdn } }] },
      overrideAccess: true,
    })
    if (dupe.totalDocs > 0) {
      return bad('You have already reviewed this product. Thank you!', 409)
    }
  }

  // Verified purchase: does this phone have a delivered/paid order containing one of this product's SKUs?
  let verifiedPurchase = false
  if (phoneValid) {
    const variants = await payload.find({
      collection: 'variants',
      where: { product: { equals: product.id } },
      depth: 0,
      limit: 200,
      overrideAccess: true,
    })
    const skus = (variants.docs as Variant[]).map((v) => v.sku).filter((s): s is string => Boolean(s))
    verifiedPurchase = await hasPurchasedProduct(payload, msisdn, skus)
  }

  await payload.create({
    collection: 'reviews',
    overrideAccess: true,
    data: {
      product: product.id,
      rating,
      title: title || undefined,
      body,
      authorName,
      authorPhone: phoneValid ? msisdn : undefined,
      authorIp: ip,
      status: 'pending', // #12 — never auto-approve
      verifiedPurchase,
    },
  })

  return NextResponse.json({ ok: true, verified: verifiedPurchase })
}
