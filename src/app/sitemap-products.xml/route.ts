import { collectionUrlset } from '@/lib/seo/sitemap'

export const revalidate = 3600

export async function GET() {
  const body = await collectionUrlset('products', '/products', { changefreq: 'daily', priority: 0.8 })
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}
