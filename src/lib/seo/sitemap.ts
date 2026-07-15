import type { CollectionSlug } from 'payload'

import { getPayloadClient } from '@/lib/payload'
import { absUrl, siteUrl } from './urls'

/** XML sitemaps (§14.1). Regenerated on the ISR window; the catalog revalidate hooks bust reads. */
export type UrlEntry = { loc: string; lastmod?: string; changefreq?: string; priority?: number }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

export function urlsetXml(entries: UrlEntry[]): string {
  const body = entries
    .map((e) => {
      const parts = [`<loc>${esc(e.loc)}</loc>`]
      if (e.lastmod) parts.push(`<lastmod>${esc(e.lastmod)}</lastmod>`)
      if (e.changefreq) parts.push(`<changefreq>${e.changefreq}</changefreq>`)
      if (e.priority != null) parts.push(`<priority>${e.priority.toFixed(1)}</priority>`)
      return `<url>${parts.join('')}</url>`
    })
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`
}

export function sitemapIndexXml(paths: string[], site = siteUrl()): string {
  const body = paths.map((p) => `<sitemap><loc>${esc(absUrl(p, site))}</loc></sitemap>`).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`
}

/** Slug + updatedAt for a catalog collection. Products are limited to published. */
export async function fetchSlugs(collection: Extract<CollectionSlug, 'products' | 'categories' | 'brands' | 'ingredients'>): Promise<{ slug: string; updatedAt?: string }[]> {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection,
    where: collection === 'products' ? { _status: { equals: 'published' } } : {},
    depth: 0,
    limit: 5000,
    select: { slug: true, updatedAt: true } as never,
    overrideAccess: true,
  })
  return res.docs
    .map((d) => ({ slug: (d as { slug?: string }).slug ?? '', updatedAt: (d as { updatedAt?: string }).updatedAt }))
    .filter((d) => d.slug)
}

/** Build a urlset for a collection under a path prefix. */
export async function collectionUrlset(
  collection: Extract<CollectionSlug, 'products' | 'categories' | 'brands' | 'ingredients'>,
  prefix: string,
  opts: { changefreq?: string; priority?: number } = {},
): Promise<string> {
  const site = siteUrl()
  const rows = await fetchSlugs(collection)
  return urlsetXml(rows.map((r) => ({ loc: absUrl(`${prefix}/${r.slug}`, site), lastmod: r.updatedAt, changefreq: opts.changefreq, priority: opts.priority })))
}

/**
 * The child sitemaps that exist today. Category/brand sitemaps are intentionally OMITTED until the
 * /categories/[slug] and /brands/[slug] PLP routes ship (deferred with the category pages) — listing
 * them would fill the sitemap with 404s and burn crawl trust. Posts sitemap deferred with the blog.
 */
export const SITEMAP_CHILDREN = ['/sitemap-products.xml', '/sitemap-ingredients.xml', '/sitemap-static.xml']

export const STATIC_PATHS = ['/', '/ingredients', '/verify']
