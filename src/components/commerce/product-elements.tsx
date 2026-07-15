import Link from 'next/link'
import clsx from 'clsx'

import type { Media, Product } from '@/payload-types'

/** Best image URL for a product's first image (relative /api/media/... — resolves to the serving origin). */
export function productImage(product: Pick<Product, 'images'>): { url: string; alt: string } | null {
  const first = product.images?.[0]
  const m = first?.image
  if (!m || typeof m !== 'object') return null
  const md = m as Media
  const sizes = (md.sizes ?? {}) as Record<string, { url?: string | null } | undefined>
  const url = sizes.card?.url || sizes.hero?.url || md.url || ''
  return url ? { url, alt: first?.alt ?? md.alt ?? product.images?.[0]?.alt ?? '' } : null
}

const fmt = (n: number | null | undefined) => (n == null ? '' : `৳${n.toLocaleString('en-US')}`)

/** Price — Geist Mono, right-aligned; the blue pill variant is used inside product labels. */
export function Price({ amount, className }: { amount: number | null | undefined; className?: string }) {
  if (amount == null) return null
  return <p className={clsx('font-mono', className)} suppressHydrationWarning>{fmt(amount)}</p>
}

/** The floating product label — title + a blue price pill, over the image (Vercel Commerce). */
export function Label({ title, amount, position = 'bottom' }: { title: string; amount: number | null; position?: 'bottom' | 'center' }) {
  return (
    <div className={clsx('absolute bottom-0 left-0 flex w-full px-4 pb-4 @container/label', { 'lg:px-20 lg:pb-[35%]': position === 'center' })}>
      <div className="flex items-center rounded-full border bg-white/70 p-1 text-xs font-semibold text-black backdrop-blur-md dark:border-neutral-800 dark:bg-black/70 dark:text-white">
        <h3 className="mr-4 line-clamp-2 grow pl-2 leading-none tracking-tight">{title}</h3>
        {amount != null && <Price amount={amount} className="flex-none rounded-full bg-blue-600 p-2 text-white" />}
      </div>
    </div>
  )
}

/** Bordered, hover-zoom image tile — the building block of every product card + the hero grid. */
export function GridTileImage({
  src,
  alt,
  label,
  active,
  isInteractive = true,
  sizes,
}: {
  src?: string
  alt: string
  label?: { title: string; amount: number | null; position?: 'bottom' | 'center' }
  active?: boolean
  isInteractive?: boolean
  sizes?: string
}) {
  return (
    <div className={clsx('group flex h-full w-full items-center justify-center overflow-hidden rounded-lg border bg-white hover:border-blue-600 dark:bg-black relative', { 'border-2 border-blue-600': active, 'border-neutral-200 dark:border-neutral-800': !active })}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- pre-generated responsive set, served unoptimized
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading="lazy"
          className={clsx('relative h-full w-full object-contain', { 'transition duration-300 ease-in-out group-hover:scale-105': isInteractive })}
        />
      ) : (
        <div className="h-full w-full bg-neutral-100 dark:bg-neutral-900" aria-hidden />
      )}
      {label && <Label title={label.title} amount={label.amount} position={label.position} />}
    </div>
  )
}

/** A grid of product cards (used on /search and related sections). */
export function ProductGridItems({ products }: { products: { product: Product; priceFrom: number | null }[] }) {
  return (
    <>
      {products.map(({ product, priceFrom }) => {
        const img = productImage(product)
        return (
          <li key={product.id} className="aspect-square transition-opacity">
            <Link href={`/products/${product.slug}`} prefetch className="relative inline-block h-full w-full">
              <GridTileImage src={img?.url} alt={img?.alt ?? product.title} label={{ title: product.title, amount: priceFrom }} sizes="(min-width: 768px) 33vw, 100vw" />
            </Link>
          </li>
        )
      })}
    </>
  )
}
