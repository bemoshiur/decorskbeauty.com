import { sitemapIndexXml, SITEMAP_CHILDREN } from '@/lib/seo/sitemap'

export const revalidate = 3600

const xml = (body: string) => new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } })

/** Sitemap index (§14.1) → per-type child sitemaps. Single locale (English-only build). */
export function GET() {
  return xml(sitemapIndexXml(SITEMAP_CHILDREN))
}
