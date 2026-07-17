import type { Brand, Ingredient, Product, Variant } from '@/payload-types'
import type { ReviewCard, ReviewSummary } from '@/lib/commerce/reviews'
import { absUrl, imageUrl, siteUrl } from './urls'
import { shippingDetails, merchantReturnPolicy, type ReturnPolicyConfig } from './shipping'

/**
 * JSON-LD builders (§14.2). Pure functions returning plain objects rendered by <JsonLd>. Every
 * absolute URL flows through urls.ts. AggregateRating / Review render ONLY from the reviewSummary +
 * reviews the caller passes, which come exclusively from APPROVED rows in the reviews collection
 * (getReviewSummary / listApprovedReviews). With zero approved reviews the caller passes count 0 and no
 * rating is emitted — so a star rating can never be seeded or faked (#12/#29).
 */
export const ORG_ID = (site = siteUrl()) => `${site}/#organization`
export const WEBSITE_ID = (site = siteUrl()) => `${site}/#website`

/** Locked business facts (§1 / CLAUDE.md). Single source for every identity block. */
export const BUSINESS = {
  name: "Decor's K-Beauty",
  legalName: "Decor's K-Beauty",
  phone: '+8801712113032',
  streetAddress: 'Flat B5, House 32-34, Road 7, Block C, Banani',
  addressLocality: 'Dhaka',
  postalCode: '1212',
  addressCountry: 'BD',
} as const

export function organization(site = siteUrl()): object {
  return {
    '@type': 'Organization',
    '@id': ORG_ID(site),
    name: BUSINESS.name,
    url: `${site}/`,
    logo: absUrl('/og.png', site),
    telephone: BUSINESS.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.streetAddress,
      addressLocality: BUSINESS.addressLocality,
      postalCode: BUSINESS.postalCode,
      addressCountry: BUSINESS.addressCountry,
    },
  }
}

export function website(site = siteUrl()): object {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID(site),
    url: `${site}/`,
    name: BUSINESS.name,
    publisher: { '@id': ORG_ID(site) },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${site}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function localBusiness(site = siteUrl()): object {
  return {
    '@type': 'HealthAndBeautyBusiness',
    '@id': `${site}/#localbusiness`,
    name: BUSINESS.name,
    image: absUrl('/og.png', site),
    url: `${site}/`,
    telephone: BUSINESS.phone,
    priceRange: '৳৳',
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.streetAddress,
      addressLocality: BUSINESS.addressLocality,
      postalCode: BUSINESS.postalCode,
      addressCountry: BUSINESS.addressCountry,
    },
    parentOrganization: { '@id': ORG_ID(site) },
  }
}

export function breadcrumb(items: { name: string; path: string }[], site = siteUrl()): object {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absUrl(it.path, site),
    })),
  }
}

const availabilityUrl = (product: Pick<Product, 'fulfilmentMode'>, availableQty: number): string => {
  if (product.fulfilmentMode === 'preOrder') return 'https://schema.org/PreOrder'
  return availableQty > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
}

const price = (v: Pick<Variant, 'mrp' | 'salePrice'>): number => (v.salePrice != null ? v.salePrice : v.mrp)

/**
 * Product + Offer (§14.2). One Offer per active variant carrying the SKU (#1 identity spine, the same
 * string as the feed/Pixel/CAPI), price, availability, shippingDetails and hasMerchantReturnPolicy.
 * Multiple variants collapse to an AggregateOffer with the price range.
 */
export function productJsonLd(args: {
  product: Product
  variants: Variant[]
  returnPolicy?: ReturnPolicyConfig
  reviewSummary?: ReviewSummary
  reviews?: ReviewCard[]
  site?: string
}): object | null {
  const site = args.site ?? siteUrl()
  const { product, variants } = args
  // No purchasable variant → no valid Offer. A Product with none of offers/review/aggregateRating is
  // a Rich Results ERROR, so emit no Product node at all rather than an invalid one.
  if (!variants.length) return null
  const brand = product.brand && typeof product.brand === 'object' ? (product.brand as Brand) : null
  const url = absUrl(`/products/${product.slug}`, site)
  const images = (product.images ?? []).map((im) => imageUrl(im.image, site)).filter((u): u is string => Boolean(u))
  const ret = merchantReturnPolicy(args.returnPolicy)
  const ship = shippingDetails()

  const offers = variants.map((v) => ({
    '@type': 'Offer',
    sku: v.sku, // #1 — byte-identical to the catalog feed id / Pixel content_ids / CAPI contents[].id
    price: price(v).toFixed(2),
    priceCurrency: 'BDT',
    availability: availabilityUrl(product, v.availableQty ?? 0),
    itemCondition: 'https://schema.org/NewCondition',
    url,
    shippingDetails: ship,
    hasMerchantReturnPolicy: ret,
  }))

  // #12/#29: rating renders ONLY from real approved reviews. count === 0 → no aggregateRating node at all.
  const summary = args.reviewSummary
  const ratingBlock =
    summary && summary.count > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: summary.average,
            reviewCount: summary.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}
  const reviewBlock =
    args.reviews && args.reviews.length
      ? {
          review: args.reviews.slice(0, 10).map((r) => ({
            '@type': 'Review',
            reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
            author: { '@type': 'Person', name: r.authorName },
            ...(r.title ? { name: r.title } : {}),
            reviewBody: r.body,
            datePublished: r.createdAt,
          })),
        }
      : {}

  const prices = variants.map((v) => price(v))
  const offerBlock =
    variants.length === 1
      ? offers[0]
      : variants.length > 1
        ? {
            '@type': 'AggregateOffer',
            priceCurrency: 'BDT',
            lowPrice: Math.min(...prices).toFixed(2),
            highPrice: Math.max(...prices).toFixed(2),
            offerCount: variants.length,
            offers,
          }
        : undefined

  return {
    '@type': 'Product',
    name: product.title,
    ...(images.length ? { image: images } : {}),
    description: product.seo?.metaDescription ?? product.shortDescription ?? undefined,
    sku: variants[0]?.sku, // primary SKU (#1)
    ...(brand ? { brand: { '@type': 'Brand', name: brand.name } } : {}),
    ...(offerBlock ? { offers: offerBlock } : {}),
    // aggregateRating / review appear ONLY when real approved reviews exist (#12/#29) — see ratingBlock.
    ...ratingBlock,
    ...reviewBlock,
  }
}

/** FAQPage from products.faq (§14.2). Returns null when there are no FAQs (never an empty FAQPage). */
export function faqPage(faq: { question?: string | null; answer?: string | null }[] | null | undefined): object | null {
  const entries = (faq ?? []).filter((f) => f.question && f.answer)
  if (!entries.length) return null
  return {
    '@type': 'FAQPage',
    mainEntity: entries.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}

/** ItemList for a PLP / home grid (§14.2). */
export function itemList(products: { slug?: string | null; title: string }[], site = siteUrl()): object {
  return {
    '@type': 'ItemList',
    itemListElement: products
      .filter((p) => p.slug)
      .map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: absUrl(`/products/${p.slug}`, site), name: p.title })),
  }
}

/** DefinedTerm for an ingredient glossary entry (§14.2/§14.3). */
export function definedTerm(ingredient: Pick<Ingredient, 'name' | 'slug' | 'benefits'>, site = siteUrl()): object {
  return {
    '@type': 'DefinedTerm',
    '@id': absUrl(`/ingredients/${ingredient.slug}#term`, site),
    name: ingredient.name,
    ...(ingredient.benefits ? { description: ingredient.benefits } : {}),
    inDefinedTermSet: absUrl('/ingredients', site),
    url: absUrl(`/ingredients/${ingredient.slug}`, site),
  }
}

/** DefinedTermSet for the glossary index (§14.2). */
export function definedTermSet(ingredients: { name: string; slug?: string | null }[], site = siteUrl()): object {
  return {
    '@type': 'DefinedTermSet',
    '@id': absUrl('/ingredients', site),
    name: 'K-Beauty ingredient glossary',
    hasDefinedTerm: ingredients
      .filter((i) => i.slug)
      .map((i) => ({ '@type': 'DefinedTerm', name: i.name, url: absUrl(`/ingredients/${i.slug}`, site) })),
  }
}

/** Wrap one or more schema objects into a single @graph document. */
export function graph(...nodes: (object | null | undefined)[]): object {
  return { '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) }
}
