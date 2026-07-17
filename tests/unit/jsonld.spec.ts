import { describe, it, expect } from 'vitest'

import type { Product, Variant } from '@/payload-types'
import {
  organization,
  website,
  localBusiness,
  breadcrumb,
  productJsonLd,
  faqPage,
  itemList,
  definedTerm,
  definedTermSet,
  graph,
} from '@/lib/seo/jsonld'
import { shippingDetails, merchantReturnPolicy } from '@/lib/seo/shipping'
import { urlsetXml, sitemapIndexXml } from '@/lib/seo/sitemap'
import { absUrl } from '@/lib/seo/urls'
import robots from '@/app/robots'

const SITE = 'https://decorskbeauty.com'
const variant = (sku: string, over: Partial<Variant> = {}): Variant =>
  ({ id: 1, sku, mrp: 1000, salePrice: null, availableQty: 5, active: true, ...over }) as Variant
const product = (over: Partial<Product> = {}): Product =>
  ({ id: 1, title: 'Snail Mucin Essence', slug: 'snail-mucin-essence', fulfilmentMode: 'readyStock', ...over }) as Product

describe('Product JSON-LD (§14.2)', () => {
  it('emits a single Offer with the SKU (#1), shippingDetails and hasMerchantReturnPolicy, no rating', () => {
    const data = productJsonLd({ product: product(), variants: [variant('SNL-100')], site: SITE }) as Record<string, unknown>
    expect(data['@type']).toBe('Product')
    const offer = data.offers as Record<string, unknown>
    expect(offer['@type']).toBe('Offer')
    expect(offer.sku).toBe('SNL-100') // identity spine (#1)
    expect(offer.priceCurrency).toBe('BDT')
    expect(offer.availability).toBe('https://schema.org/InStock')
    expect(Array.isArray(offer.shippingDetails)).toBe(true)
    expect((offer.shippingDetails as unknown[]).length).toBe(3)
    expect((offer.hasMerchantReturnPolicy as Record<string, unknown>)['@type']).toBe('MerchantReturnPolicy')
    // #12/#29 — never a rating without real reviews.
    expect(data.aggregateRating).toBeUndefined()
    expect(JSON.stringify(data)).not.toContain('aggregateRating')
  })

  it('collapses multiple variants to an AggregateOffer with the price range', () => {
    const data = productJsonLd({
      product: product(),
      variants: [variant('A', { mrp: 1200 }), variant('B', { mrp: 800, salePrice: 700 })],
      site: SITE,
    }) as Record<string, unknown>
    const agg = data.offers as Record<string, unknown>
    expect(agg['@type']).toBe('AggregateOffer')
    expect(agg.lowPrice).toBe('700.00') // sale price wins
    expect(agg.highPrice).toBe('1200.00')
    expect(agg.offerCount).toBe(2)
    expect((agg.offers as unknown[]).length).toBe(2)
  })

  it('returns null (no Product node) when there are no active variants — avoids an offer-less Product (Rich Results ERROR)', () => {
    expect(productJsonLd({ product: product(), variants: [], site: SITE })).toBeNull()
  })

  it('marks a pre-order product as PreOrder and an out-of-stock variant OutOfStock', () => {
    const pre = productJsonLd({ product: product({ fulfilmentMode: 'preOrder' }), variants: [variant('P', { availableQty: 0 })], site: SITE }) as Record<string, unknown>
    expect((pre.offers as Record<string, unknown>).availability).toBe('https://schema.org/PreOrder')
    const oos = productJsonLd({ product: product(), variants: [variant('O', { availableQty: 0 })], site: SITE }) as Record<string, unknown>
    expect((oos.offers as Record<string, unknown>).availability).toBe('https://schema.org/OutOfStock')
  })
})

describe('Product JSON-LD rating (#12/#29 — real approved reviews only)', () => {
  const dist = (over: Partial<Record<1 | 2 | 3 | 4 | 5, number>> = {}) => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, ...over })
  const build = (
    summary: { count: number; average: number; distribution: ReturnType<typeof dist> },
    reviews: Parameters<typeof productJsonLd>[0]['reviews'] = [],
  ) => productJsonLd({ product: product(), variants: [variant('R-1')], reviewSummary: summary, reviews, site: SITE }) as Record<string, unknown>

  it('emits AggregateRating from a real summary', () => {
    const data = build({ count: 3, average: 4.7, distribution: dist({ 4: 1, 5: 2 }) })
    const ar = data.aggregateRating as Record<string, unknown>
    expect(ar['@type']).toBe('AggregateRating')
    expect(ar.ratingValue).toBe(4.7)
    expect(ar.reviewCount).toBe(3)
    expect(ar.bestRating).toBe(5)
  })

  it('emits Review nodes carrying author, rating and body', () => {
    const data = build({ count: 1, average: 5, distribution: dist({ 5: 1 }) }, [
      { id: 1, rating: 5, title: 'Love it', body: 'Cleared my skin', authorName: 'Rima', verifiedPurchase: true, createdAt: '2026-07-15T00:00:00.000Z' },
    ])
    const reviews = data.review as Record<string, unknown>[]
    expect(reviews.length).toBe(1)
    expect((reviews[0].author as Record<string, unknown>).name).toBe('Rima')
    expect((reviews[0].reviewRating as Record<string, unknown>).ratingValue).toBe(5)
    expect(reviews[0].reviewBody).toBe('Cleared my skin')
  })

  it('emits NO rating when the summary count is 0 — even if a stray reviews array is passed', () => {
    const data = build({ count: 0, average: 0, distribution: dist() }, [])
    expect(data.aggregateRating).toBeUndefined()
    expect(JSON.stringify(data)).not.toContain('aggregateRating')
  })

  it('caps embedded Review nodes at 10', () => {
    const many = Array.from({ length: 25 }, (_, i) => ({
      id: i, rating: 5, title: null, body: `r${i}`, authorName: `A${i}`, verifiedPurchase: false, createdAt: '2026-07-15T00:00:00.000Z',
    }))
    const data = build({ count: 25, average: 5, distribution: dist({ 5: 25 }) }, many)
    expect((data.review as unknown[]).length).toBe(10)
  })
})

describe('shippingDetails + returns (§14.2)', () => {
  it('has one entry per zone at the real ৳80/৳110/৳140 rates', () => {
    const s = shippingDetails() as Record<string, unknown>[]
    expect(s.length).toBe(3)
    const rates = s.map((d) => (d.shippingRate as Record<string, unknown>).value).sort()
    expect(rates).toEqual(['110.00', '140.00', '80.00'].sort())
    expect((s[0].shippingDestination as Record<string, unknown>).addressCountry).toBe('BD')
  })

  it('returns policy reflects config — finite window vs not-permitted', () => {
    expect((merchantReturnPolicy({ returnsAccepted: true, returnWindowDays: 3 }) as Record<string, unknown>).returnPolicyCategory).toBe('https://schema.org/MerchantReturnFiniteReturnWindow')
    expect((merchantReturnPolicy({ returnsAccepted: false }) as Record<string, unknown>).returnPolicyCategory).toBe('https://schema.org/MerchantReturnNotPermitted')
  })
})

describe('FAQPage / ItemList / DefinedTerm', () => {
  it('builds a FAQPage from faq entries and returns null when empty', () => {
    const faq = faqPage([{ question: 'Is it authentic?', answer: 'Yes — verify the batch code.' }]) as Record<string, unknown>
    expect(faq['@type']).toBe('FAQPage')
    expect((faq.mainEntity as unknown[]).length).toBe(1)
    expect(faqPage([])).toBeNull()
    expect(faqPage([{ question: 'x', answer: '' }])).toBeNull() // incomplete entry dropped → empty → null
  })

  it('ItemList links products by slug', () => {
    const list = itemList([{ slug: 'a', title: 'A' }, { slug: null, title: 'skip' }], SITE) as Record<string, unknown>
    const els = list.itemListElement as Record<string, unknown>[]
    expect(els.length).toBe(1)
    expect(els[0].url).toBe(`${SITE}/products/a`)
  })

  it('DefinedTerm points into the glossary set', () => {
    const t = definedTerm({ name: 'Niacinamide', slug: 'niacinamide', benefits: 'Brightens' }, SITE) as Record<string, unknown>
    expect(t['@type']).toBe('DefinedTerm')
    expect(t.inDefinedTermSet).toBe(`${SITE}/ingredients`)
    const set = definedTermSet([{ name: 'Niacinamide', slug: 'niacinamide' }], SITE) as Record<string, unknown>
    expect((set.hasDefinedTerm as unknown[]).length).toBe(1)
  })
})

describe('Identity blocks + breadcrumb', () => {
  it('organization/website/localBusiness share stable @ids', () => {
    expect((organization(SITE) as Record<string, unknown>)['@id']).toBe(`${SITE}/#organization`)
    expect((website(SITE) as Record<string, unknown>).potentialAction).toBeTruthy()
    expect((localBusiness(SITE) as Record<string, unknown>)['@type']).toBe('HealthAndBeautyBusiness')
  })
  it('breadcrumb numbers positions from 1', () => {
    const bc = breadcrumb([{ name: 'Home', path: '/' }, { name: 'X', path: '/products/x' }], SITE) as Record<string, unknown>
    const els = bc.itemListElement as Record<string, unknown>[]
    expect(els[0].position).toBe(1)
    expect(els[1].item).toBe(`${SITE}/products/x`)
  })
  it('graph wraps nodes and drops nullish', () => {
    const g = graph(organization(SITE), null, undefined) as Record<string, unknown>
    expect(g['@context']).toBe('https://schema.org')
    expect((g['@graph'] as unknown[]).length).toBe(1)
  })
})

describe('sitemap + robots (§14.1)', () => {
  it('urlset escapes and includes lastmod/priority', () => {
    const xml = urlsetXml([{ loc: absUrl('/products/a&b', SITE), lastmod: '2026-07-15', priority: 0.8 }])
    expect(xml).toContain('<urlset')
    expect(xml).toContain('a&amp;b')
    expect(xml).toContain('<priority>0.8</priority>')
  })
  it('sitemap index lists children as absolute URLs', () => {
    const xml = sitemapIndexXml(['/sitemap-products.xml'], SITE)
    expect(xml).toContain(`<loc>${SITE}/sitemap-products.xml</loc>`)
  })
  it('robots allows AI crawlers, blocks private paths, points to the sitemap', () => {
    const r = robots()
    const agents = (r.rules as { userAgent?: string | string[] }[]).flatMap((x) => x.userAgent ?? [])
    expect(agents).toContain('ClaudeBot')
    expect(agents).toContain('GPTBot')
    const anyRule = (r.rules as { disallow?: string | string[] }[])[0]
    expect((anyRule.disallow as string[]).includes('/checkout')).toBe(true)
    expect(String(r.sitemap).endsWith('/sitemap.xml')).toBe(true) // host is env-driven
  })
})
