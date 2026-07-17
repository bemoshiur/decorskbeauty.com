import Link from 'next/link'

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

/** Premium product card: responsive image with hover-zoom, merchandising badge, brand, title, price.
 *  Server component — motion (reveal) is applied by the parent grid. */
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
        'group relative flex flex-col overflow-hidden rounded-card bg-cloud ring-1 ring-line/70',
        'ring-soft transition-[transform,box-shadow] duration-300 ease-out-soft hover:-translate-y-1 hover:shadow-lift',
      )}
    >
      <div className="relative overflow-hidden">
        <StoreImage
          media={firstImage}
          alt={product.images?.[0]?.alt ?? product.title}
          priority={priority}
          sizes={sizes ?? '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw'}
          imgClassName="transition-transform duration-500 ease-out-soft group-hover:scale-[1.06]"
        />
        {badge && (
          <span className="absolute left-3 top-3">
            <Badge tone={badge} />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {brand && <span className="text-xs font-medium uppercase tracking-wide text-celadon-deep">{brand}</span>}
        <h3 className="line-clamp-2 text-[0.95rem] font-medium leading-snug text-ink">{product.title}</h3>
        <div className="mt-auto pt-2">
          {priceFrom != null ? (
            <span className="font-mono text-base font-semibold text-ink">{fmtBDT(priceFrom)}</span>
          ) : (
            <span className="text-sm text-grey">View price</span>
          )}
        </div>
      </div>
    </Link>
  )
}
