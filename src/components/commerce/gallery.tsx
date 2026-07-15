'use client'

import { useState } from 'react'

/** Product gallery — large image + thumbnail strip with prev/next (Vercel Commerce). */
export function Gallery({ images }: { images: { url: string; alt: string }[] }) {
  const [idx, setIdx] = useState(0)
  if (!images.length) return <div className="aspect-square w-full rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900" />
  const img = images[idx]
  const go = (d: number) => setIdx((i) => (i + d + images.length) % images.length)

  return (
    <div>
      <div className="relative aspect-square h-full max-h-[550px] w-full overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-generated set served unoptimized */}
        <img src={img.url} alt={img.alt} className="h-full w-full object-contain" />
        {images.length > 1 && (
          <div className="absolute bottom-[15%] flex w-full justify-center">
            <div className="mx-auto flex h-11 items-center rounded-full border border-white bg-neutral-50/80 text-neutral-500 backdrop-blur-sm dark:border-black dark:bg-neutral-900/80">
              <button onClick={() => go(-1)} aria-label="Previous image" className="flex h-full items-center px-4 hover:text-black dark:hover:text-white">‹</button>
              <div className="mx-1 h-6 w-px bg-neutral-500" />
              <button onClick={() => go(1)} aria-label="Next image" className="flex h-full items-center px-4 hover:text-black dark:hover:text-white">›</button>
            </div>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <ul className="my-4 flex items-center gap-2 overflow-auto py-1">
          {images.map((im, i) => (
            <li key={i} className="h-20 w-20 flex-none">
              <button onClick={() => setIdx(i)} aria-label={`Image ${i + 1}`} className={`h-full w-full overflow-hidden rounded-lg border bg-white dark:bg-black ${i === idx ? 'border-2 border-blue-600' : 'border-neutral-200 hover:border-blue-600 dark:border-neutral-800'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.url} alt={im.alt} className="h-full w-full object-contain" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
