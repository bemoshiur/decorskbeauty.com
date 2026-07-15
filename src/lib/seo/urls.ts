import type { Media } from '@/payload-types'

/** The canonical site origin (no trailing slash). One source of truth for every absolute URL. */
export const siteUrl = (): string => (process.env.NEXT_PUBLIC_SITE_URL || 'https://decorskbeauty.com').replace(/\/$/, '')

/** Absolute URL for a path or an already-absolute URL. */
export const absUrl = (path: string, site = siteUrl()): string => {
  if (/^https?:\/\//i.test(path)) return path
  return `${site}${path.startsWith('/') ? '' : '/'}${path}`
}

/** Best absolute image URL for a media doc: prefer the 1200px hero size, fall back to the original. */
export function imageUrl(media: unknown, site = siteUrl()): string | null {
  if (!media || typeof media !== 'object') return null
  const m = media as Media
  const sizes = (m.sizes ?? {}) as Record<string, { url?: string | null } | undefined>
  const raw = sizes.hero?.url || sizes.card?.url || m.url || null
  return raw ? absUrl(raw, site) : null
}
