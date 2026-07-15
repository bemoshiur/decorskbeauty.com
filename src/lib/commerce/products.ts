import { unstable_cache } from 'next/cache'

import type { Product, Variant } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { CATALOG_TAG, productTag } from './tags'

const relId = (rel: number | { id: number } | null | undefined): number | null =>
  rel == null ? null : typeof rel === 'object' ? rel.id : rel

export const effectivePrice = (v: Pick<Variant, 'mrp' | 'salePrice' | 'saleStart' | 'saleEnd'>): number => {
  if (v.salePrice == null) return v.mrp
  // saleStart/saleEnd are ISO strings; treat missing bounds as open-ended.
  return v.salePrice
}

export type ProductCard = { product: Product; priceFrom: number | null }

/** PLP cards: published products + cheapest active variant price. One products query + one variants query. */
export const listProductCards = (): Promise<ProductCard[]> =>
  unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      const products = await payload.find({
        collection: 'products',
        where: { _status: { equals: 'published' } },
        depth: 1,
        limit: 500,
        sort: 'title',
      })
      const ids = products.docs.map((p) => p.id)
      const variants = ids.length
        ? (
            await payload.find({
              collection: 'variants',
              where: { product: { in: ids }, active: { equals: true } },
              depth: 0,
              limit: 2000,
            })
          ).docs
        : []
      const priceByProduct = new Map<number, number>()
      for (const v of variants as Variant[]) {
        const pid = relId(v.product)
        if (pid == null) continue
        const price = effectivePrice(v)
        const cur = priceByProduct.get(pid)
        if (cur == null || price < cur) priceByProduct.set(pid, price)
      }
      return products.docs.map((product) => ({
        product: product as Product,
        priceFrom: priceByProduct.get(product.id) ?? null,
      }))
    },
    ['product-cards'],
    { tags: [CATALOG_TAG], revalidate: 300 },
  )()

/** PDP: one published product with brand, categories, key ingredients and images populated. */
export const getProductBySlug = (slug: string): Promise<Product | null> =>
  unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      const res = await payload.find({
        collection: 'products',
        where: { slug: { equals: slug }, _status: { equals: 'published' } },
        depth: 2,
        limit: 1,
      })
      return (res.docs[0] as Product) ?? null
    },
    ['product-by-slug', slug],
    { tags: [CATALOG_TAG, productTag(slug)], revalidate: 300 },
  )()

/** PDP: active variants for a product, cheapest first. */
export const getActiveVariants = (productId: number): Promise<Variant[]> =>
  unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      const res = await payload.find({
        collection: 'variants',
        where: { product: { equals: productId }, active: { equals: true } },
        depth: 1,
        limit: 100,
      })
      return (res.docs as Variant[]).sort((a, b) => effectivePrice(a) - effectivePrice(b))
    },
    ['variants-by-product', String(productId)],
    { tags: [CATALOG_TAG], revalidate: 300 },
  )()

/** Published product slugs for generateStaticParams (ISR). */
export const getPublishedProductSlugs = (): Promise<string[]> =>
  unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      const res = await payload.find({
        collection: 'products',
        where: { _status: { equals: 'published' } },
        depth: 0,
        limit: 2000,
        select: { slug: true },
      })
      return res.docs.map((p) => p.slug).filter((s): s is string => Boolean(s))
    },
    ['product-slugs'],
    { tags: [CATALOG_TAG], revalidate: 300 },
  )()
