import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import type { ProductCard as ProductCardData } from '@/lib/commerce'
import type { Brand } from '@/payload-types'
import { cn } from '@/lib/cn'
import { StoreImage } from '@/components/ui/StoreImage'
import { Badge } from '@/components/ui/Badge'

const fmtBDT = (n: number | null | undefined) => (n == null ? null : `৳${n.toLocaleString('en-US')}`)

const BADGE_TONE: Record<string, 'bestseller' | 'new' | 'sale' | 'limited'> = {
  bestseller: 'bestseller',
  new: 'new',
  sale: 'sale',
  limited: 'limited',
}

/** Premium product card: responsive image with hover-zoom, a slide-up "Order now" bar on hover,
 *  merchandising badge, brand, title, price. Server component (motion handled by parents). */
export function ProductCard({ data, priority = false, sizes }: { data: ProductCardData; priority?: boolean; sizes?: string }) {
  const { product, priceFrom } = data
  const brand = product.brand && typeof product.brand === 'object' ? (product.brand as Brand).name : null
  const firstImage = product.images?.[0]?.image
  const badge = product.homeBadge && product.homeBadge !== 'none' ? BADGE_TONE[product.homeBadge] : product.isNew ? 'new' : null

  return (
    <Link
      href={`/products/${product.slug}`}
      prefetch
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-card bg-cloud ring-1 ring-line/70',
        'transition-[transform,box-shadow,border-color] duration-300 ease-out-soft',
        'hover:-translate-y-1.5 hover:shadow-lift hover:ring-celadon/50',
      )}
    >
      <div className="relative overflow-hidden bg-mist/40">
        <StoreImage
          media={firstImage}
          alt={product.images?.[0]?.alt ?? product.title}
          priority={priority}
          sizes={sizes ?? '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw'}
          imgClassName="transition-transform duration-[600ms] ease-out-soft group-hover:scale-[1.07]"
        />
        {badge && (
          <span className="absolute left-3 top-3 z-10">
            <Badge tone={badge} />
          </span>
        )}
        {/* Slide-up order affordance (reinforces the tap target; whole card links to the PDP). */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full p-3 transition-transform duration-300 ease-out-soft group-hover:translate-y-0"
          aria-hidden
        >
          <span className="grad-cta flex h-10 items-center justify-center gap-1.5 rounded-full text-sm font-semibold text-white shadow-lift">
            Order now <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {brand && <span className="text-xs font-semibold uppercase tracking-wide text-celadon-deep">{brand}</span>}
        <h3 className="line-clamp-2 text-[0.95rem] font-medium leading-snug text-ink">{product.title}</h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          {priceFrom != null ? (
            <span className="font-mono text-base font-semibold text-ink">{fmtBDT(priceFrom)}</span>
          ) : (
            <span className="text-sm text-grey">View price</span>
          )}
          <ArrowRight className="h-4 w-4 -translate-x-1 text-grey opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:text-celadon-deep group-hover:opacity-100" aria-hidden />
        </div>
      </div>
    </Link>
  )
}
