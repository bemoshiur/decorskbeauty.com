import { unstable_cache } from 'next/cache'

import type { Ingredient } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { CATALOG_TAG } from './tags'

/** Ingredient glossary — the AEO surface (§14.3). Read through lib (never the storefront → Payload). */
export const listIngredients = (): Promise<Ingredient[]> =>
  unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      const res = await payload.find({ collection: 'ingredients', depth: 0, limit: 1000, sort: 'name' })
      return res.docs as Ingredient[]
    },
    ['ingredient-list'],
    { tags: [CATALOG_TAG], revalidate: 3600 },
  )()

export const getIngredientBySlug = (slug: string): Promise<Ingredient | null> =>
  unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      const res = await payload.find({ collection: 'ingredients', where: { slug: { equals: slug } }, depth: 1, limit: 1 })
      return (res.docs[0] as Ingredient) ?? null
    },
    ['ingredient-by-slug', slug],
    { tags: [CATALOG_TAG, `ingredient:${slug}`], revalidate: 3600 },
  )()

export const getIngredientSlugs = (): Promise<string[]> =>
  unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      const res = await payload.find({ collection: 'ingredients', depth: 0, limit: 1000, select: { slug: true } })
      return res.docs.map((i) => (i as { slug?: string }).slug).filter((s): s is string => Boolean(s))
    },
    ['ingredient-slugs'],
    { tags: [CATALOG_TAG], revalidate: 3600 },
  )()
