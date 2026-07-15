import { unstable_cache } from 'next/cache'

import type { Product, Variant } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { effectivePrice } from './products'
import { CATALOG_TAG } from './tags'
import type { ProductCard } from './products'

const relId = (rel: unknown): number | null => (rel == null ? null : typeof rel === 'object' ? ((rel as { id?: number }).id ?? null) : (rel as number))

/**
 * Related products (redesign): other published products sharing a category or the brand, cheapest
 * variant price attached. Excludes the current product. Read through lib (#13). Cached with the
 * catalog tag so a publish busts it.
 */
export const getRelatedProducts = (productId: number, limit = 8): Promise<ProductCard[]> =>
  unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      const current = await payload.findByID({ collection: 'products', id: productId, depth: 0 }).catch(() => null)
      if (!current) return []
      const categoryIds = (current.categories ?? []).map(relId).filter((x): x is number => x != null)
      const brandId = relId(current.brand)

      const or: Record<string, unknown>[] = []
      if (categoryIds.length) or.push({ categories: { in: categoryIds } })
      if (brandId != null) or.push({ brand: { equals: brandId } })
      if (!or.length) return []

      const res = await payload.find({
        collection: 'products',
        where: { and: [{ _status: { equals: 'published' } }, { id: { not_equals: productId } }, { or }] } as never,
        depth: 1,
        limit,
        sort: 'title',
      })
      const ids = res.docs.map((p) => p.id)
      if (!ids.length) return []
      const { docs: variants } = await payload.find({
        collection: 'variants',
        where: { product: { in: ids }, active: { equals: true } },
        depth: 0,
        limit: 1000,
      })
      const priceByProduct = new Map<number, number>()
      for (const v of variants as Variant[]) {
        const pid = relId(v.product)
        if (pid == null) continue
        const price = effectivePrice(v)
        const cur = priceByProduct.get(pid)
        if (cur == null || price < cur) priceByProduct.set(pid, price)
      }
      return res.docs.map((product) => ({ product: product as Product, priceFrom: priceByProduct.get(product.id) ?? null }))
    },
    ['related-products', String(productId), String(limit)],
    { tags: [CATALOG_TAG], revalidate: 300 },
  )()
