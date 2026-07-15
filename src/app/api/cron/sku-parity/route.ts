import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { safeEqual } from '@/lib/auth/timingSafe'
import { buildFeedItems } from '@/lib/seo/feed'

export const maxDuration = 60

/** SKU parity (§13.1, #1): every feed id must be a live active SKU — catch identity-spine drift. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const provided = req.headers.get('authorization')?.replace(/^Bearer /, '')
  if (!secret || !safeEqual(provided, secret)) return NextResponse.json({ ok: false }, { status: 401 })

  const payload = await getPayload({ config })
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://decorskbeauty.com'
  const items = await buildFeedItems(site)
  const { docs } = await payload.find({ collection: 'variants', where: { active: { equals: true } }, limit: 5000, depth: 0, overrideAccess: true })
  const skus = new Set(docs.map((v) => v.sku))

  const mismatches = items.map((i) => i.id).filter((id) => !skus.has(id))
  return NextResponse.json({ ok: mismatches.length === 0, checked: items.length, mismatches, alert: mismatches.length > 0 })
}
