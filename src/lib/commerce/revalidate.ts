import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { CATALOG_TAG } from './tags'

/**
 * Bust the ISR cache when catalog data changes (§15.3). Lazy-imports next/cache so these
 * modules stay loadable outside the Next runtime (payload CLI, tests). Never throws.
 */
const bust = async (slug?: unknown) => {
  try {
    // Best-effort instant bust (Next 15 revalidateTag(tag) — single arg). The ISR TTL on each read
    // (see products.ts) is the guaranteed freshness backstop if this no-ops here.
    const { revalidateTag } = await import('next/cache')
    revalidateTag(CATALOG_TAG)
    if (typeof slug === 'string' && slug) revalidateTag(`product:${slug}`)
  } catch {
    // outside a request context (CLI/seed) there's nothing to revalidate
  }
}

export const revalidateCatalogAfterChange: CollectionAfterChangeHook = async ({ doc, collection }) => {
  const slug = (doc as { slug?: unknown })?.slug
  await bust(slug)
  // IndexNow ping on publish/price change (§14.1). Only for a published product with a slug;
  // creds-gated (no-op without INDEXNOW_KEY), best-effort, never throws.
  if (collection?.slug === 'products' && typeof slug === 'string' && (doc as { _status?: string })?._status === 'published') {
    try {
      const { pingIndexNow } = await import('@/lib/seo/indexnow')
      await pingIndexNow([`/products/${slug}`])
    } catch {
      /* outside a network context — skip */
    }
  }
  return doc
}

export const revalidateCatalogAfterDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  await bust((doc as { slug?: unknown })?.slug)
  return doc
}
