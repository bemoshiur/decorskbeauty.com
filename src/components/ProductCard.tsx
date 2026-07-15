import Link from 'next/link'

import type { ProductCard as Card } from '@/lib/commerce'
import { ResponsiveImage } from './ResponsiveImage'
import { Price } from './Price'

export function ProductCard({ card }: { card: Card }) {
  const p = card.product
  const brand = p.brand && typeof p.brand === 'object' ? p.brand.name : null
  const first = p.images?.[0]
  const img = first?.image
  const preorder = p.fulfilmentMode === 'preOrder'

  return (
    <Link
      href={`/products/${p.slug}`}
      className="group flex flex-col border border-grey/30 bg-white/40 transition-colors hover:border-celadon"
    >
      <div className="relative overflow-hidden bg-paper">
        <ResponsiveImage
          media={img}
          alt={first?.alt ?? p.title}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          aspect="1 / 1"
          className="h-full w-full object-cover"
        />
        {preorder && (
          <span className="absolute left-0 top-0 bg-celadon-deep px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-paper">
            Pre-order
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {brand && (
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-grey">{brand}</p>
        )}
        <h3 className="line-clamp-2 text-sm leading-snug text-ink">{p.title}</h3>
        <Price amount={card.priceFrom} className="mt-auto pt-1 text-sm text-celadon-deep" />
      </div>
    </Link>
  )
}
