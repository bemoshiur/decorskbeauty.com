import { NextResponse } from 'next/server'

import { buildFeedItems, itemsToRss } from '@/lib/seo/feed'

export const revalidate = 21600 // 6h (§13.2)

export async function GET() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://decorskbeauty.com'
  const xml = itemsToRss(await buildFeedItems(site), { title: "Decor's K-Beauty — Google Merchant feed", link: site })
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 's-maxage=21600, stale-while-revalidate' } })
}
