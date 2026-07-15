import { urlsetXml, STATIC_PATHS } from '@/lib/seo/sitemap'
import { absUrl } from '@/lib/seo/urls'

export const revalidate = 86400

export function GET() {
  const body = urlsetXml(STATIC_PATHS.map((p) => ({ loc: absUrl(p), changefreq: 'weekly', priority: p === '/' ? 1.0 : 0.4 })))
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}
