import { collectionUrlset } from '@/lib/seo/sitemap'

export const revalidate = 3600

export async function GET() {
  const body = await collectionUrlset('ingredients', '/ingredients', { changefreq: 'monthly', priority: 0.6 })
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}
