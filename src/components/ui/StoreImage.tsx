import { cn } from '@/lib/cn'
import { buildImageSources, type MediaRel } from '@/lib/media'

/**
 * Responsive product/media image. Emits a <picture> with AVIF + WebP srcSets (400/800/1200 — the
 * pre-generated set) so mobile downloads small bytes and modern browsers get AVIF. Uses a blur
 * placeholder while loading. Pass `priority` for the single above-the-fold LCP image (eager +
 * fetchpriority=high); everything else lazy-loads. Falls back to a soft placeholder when no media.
 */
export function StoreImage({
  media,
  alt,
  sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  className,
  imgClassName,
  priority = false,
  ratio = 'square',
}: {
  media: MediaRel
  alt?: string
  sizes?: string
  className?: string
  imgClassName?: string
  priority?: boolean
  ratio?: 'square' | 'portrait' | 'landscape' | 'auto'
}) {
  const src = buildImageSources(media)
  const ratioClass =
    ratio === 'square' ? 'aspect-square' : ratio === 'portrait' ? 'aspect-[4/5]' : ratio === 'landscape' ? 'aspect-[16/10]' : ''

  if (!src) {
    return <div className={cn('bg-mist', ratioClass, className)} aria-hidden />
  }

  return (
    <div
      className={cn('relative overflow-hidden bg-mist', ratioClass, className)}
      style={src.blur ? { backgroundImage: `url(${src.blur})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      <picture>
        {src.avif && <source type="image/avif" srcSet={src.avif} sizes={sizes} />}
        {src.webp && <source type="image/webp" srcSet={src.webp} sizes={sizes} />}
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-generated responsive set, served via /api/media proxy */}
        <img
          src={src.fallback}
          alt={alt ?? src.alt}
          width={src.width}
          height={src.height}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          className={cn('h-full w-full object-cover', imgClassName)}
        />
      </picture>
    </div>
  )
}
