'use client'

import { useState } from 'react'
import { m, useReducedMotion } from 'framer-motion'
import type { MediaRel } from '@/lib/media'
import { cn } from '@/lib/cn'
import { StoreImage } from '@/components/ui/StoreImage'

export type GalleryImage = { media: MediaRel; alt: string }

/** Premium product gallery: large main image with a soft zoom + a thumbnail rail. Client component. */
export function StoreGallery({ images }: { images: GalleryImage[] }) {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  if (!images.length) {
    return <div className="aspect-square w-full rounded-feature bg-mist" aria-hidden />
  }
  const current = images[Math.min(active, images.length - 1)]

  return (
    <div className="flex flex-col gap-4">
      <m.div
        key={active}
        initial={reduce ? false : { opacity: 0.4, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="group overflow-hidden rounded-feature bg-cloud ring-1 ring-line shadow-soft"
      >
        <StoreImage
          media={current.media}
          alt={current.alt}
          priority
          ratio="square"
          sizes="(min-width: 1024px) 55vw, 100vw"
          imgClassName="object-contain transition-transform duration-500 ease-out-soft group-hover:scale-105"
        />
      </m.div>

      {images.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={cn(
                'h-16 w-16 overflow-hidden rounded-xl bg-cloud ring-1 transition-all sm:h-20 sm:w-20',
                i === active ? 'ring-2 ring-celadon-deep' : 'ring-line hover:ring-celadon',
              )}
            >
              <StoreImage media={img.media} alt="" ratio="square" sizes="80px" imgClassName="object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
