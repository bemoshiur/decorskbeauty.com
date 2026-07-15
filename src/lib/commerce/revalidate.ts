import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { CATALOG_TAG } from './tags'

/**
 * Bust the ISR cache when catalog data changes (§15.3). Lazy-imports next/cache so these
 * modules stay loadable outside the Next runtime (payload CLI, tests). Never throws.
 */
const bust = async (slug?: unknown) => {
  try {
    // Best-effort instant bust. Next 16's revalidateTag takes a cache-life profile; the ISR TTL
    // on each read (see products.ts) is the guaranteed freshness backstop if this no-ops here.
    const { revalidateTag } = await import('next/cache')
    revalidateTag(CATALOG_TAG, 'max')
    if (typeof slug === 'string' && slug) revalidateTag(`product:${slug}`, 'max')
  } catch {
    // outside a request context (CLI/seed) there's nothing to revalidate
  }
}

export const revalidateCatalogAfterChange: CollectionAfterChangeHook = async ({ doc }) => {
  await bust((doc as { slug?: unknown })?.slug)
  return doc
}

export const revalidateCatalogAfterDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  await bust((doc as { slug?: unknown })?.slug)
  return doc
}
