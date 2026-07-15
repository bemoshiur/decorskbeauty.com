import type { Media } from '@/payload-types'

type Size = { url?: string | null; width?: number | null; height?: number | null }

/**
 * Serves the pre-generated AVIF+WebP set (§15.4) directly — no per-viewport transforms.
 * Explicit width/height + blur background keep CLS at 0; `priority` marks the PDP hero (LCP).
 */
export function ResponsiveImage({
  media,
  alt,
  priority = false,
  sizes = '100vw',
  className,
  aspect = '1 / 1',
}: {
  media: Media | number | null | undefined
  alt?: string
  priority?: boolean
  sizes?: string
  className?: string
  aspect?: string
}) {
  if (!media || typeof media === 'number') {
    return <div aria-hidden className={className} style={{ aspectRatio: aspect, background: 'var(--color-paper)' }} />
  }

  const s = (media.sizes ?? {}) as Record<string, Size | undefined>
  const set = (keys: string[]) =>
    keys
      .map((k) => s[k])
      .filter((x): x is Size => Boolean(x?.url && x?.width))
      .map((x) => `${x.url} ${x.width}w`)
      .join(', ')

  const avif = set(['thumb_avif', 'card_avif', 'hero_avif'])
  const webp = set(['thumb', 'card', 'hero'])
  const fallback = s.card?.url || s.hero?.url || media.url || ''
  const w = s.hero?.width || media.width || 1200
  const h = s.hero?.height || media.height || 1200

  return (
    <picture>
      {avif && <source type="image/avif" srcSet={avif} sizes={sizes} />}
      {webp && <source type="image/webp" srcSet={webp} sizes={sizes} />}
      {/* eslint-disable-next-line @next/next/no-img-element -- pre-generated set served unoptimized (§15.4) */}
      <img
        src={fallback}
        alt={alt ?? media.alt ?? ''}
        width={w}
        height={h}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={className}
        style={{
          aspectRatio: aspect,
          backgroundImage: media.blurDataURL ? `url(${media.blurDataURL})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
    </picture>
  )
}
