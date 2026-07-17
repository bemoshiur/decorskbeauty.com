import type { Media } from '@/payload-types'

/** A media relationship can arrive as an id (depth 0) or a populated object (depth ≥1). */
export type MediaRel = number | Media | null | undefined

export function resolveMedia(rel: MediaRel): Media | null {
  return rel && typeof rel === 'object' ? (rel as Media) : null
}

type SizeMap = Record<string, { url?: string | null; width?: number | null; height?: number | null } | undefined>

/** Build AVIF + WebP srcSets (400/800/1200) from a media doc's pre-generated size set, plus a
 *  sensible fallback src, intrinsic dimensions and the blur placeholder. Returns null if unusable. */
export function buildImageSources(rel: MediaRel): {
  avif: string
  webp: string
  fallback: string
  width?: number
  height?: number
  blur?: string
  alt: string
} | null {
  const m = resolveMedia(rel)
  if (!m) return null
  const sizes = (m.sizes ?? {}) as SizeMap
  const line = (keys: [string, number][]) =>
    keys
      .map(([k, w]) => (sizes[k]?.url ? `${sizes[k]!.url} ${w}w` : null))
      .filter(Boolean)
      .join(', ')
  const avif = line([['thumb_avif', 400], ['card_avif', 800], ['hero_avif', 1200]])
  const webp = line([['thumb', 400], ['card', 800], ['hero', 1200]])
  const fallback = sizes.card?.url || sizes.hero?.url || m.url || ''
  if (!fallback) return null
  return {
    avif,
    webp,
    fallback,
    width: m.width ?? undefined,
    height: m.height ?? undefined,
    blur: (m as { blurDataURL?: string }).blurDataURL,
    alt: m.alt ?? '',
  }
}
