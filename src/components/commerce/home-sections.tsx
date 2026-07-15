import Link from 'next/link'
import clsx from 'clsx'

import type { Product } from '@/payload-types'
import { GridTileImage, productImage } from './product-elements'

type Card = { product: Product; priceFrom: number | null }

function GridItem({ item, size }: { item: Card; size: 'full' | 'half' }) {
  const img = productImage(item.product)
  return (
    <div className={clsx(size === 'full' ? 'md:col-span-4 md:row-span-2' : 'md:col-span-2 md:row-span-1')}>
      <Link className="relative block aspect-square h-full w-full" href={`/products/${item.product.slug}`} prefetch>
        <GridTileImage src={img?.url} alt={img?.alt ?? item.product.title} label={{ position: size === 'full' ? 'center' : 'bottom', title: item.product.title, amount: item.priceFrom }} sizes={size === 'full' ? '(min-width: 768px) 66vw, 100vw' : '(min-width: 768px) 33vw, 100vw'} />
      </Link>
    </div>
  )
}

/** The signature three-tile bento hero (Vercel Commerce): one large tile + two stacked. */
export function ThreeItemGrid({ items }: { items: Card[] }) {
  const [a, b, c] = items
  if (!a || !b || !c) return null
  return (
    <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-4 md:grid-cols-6 md:grid-rows-2 lg:max-h-[calc(100vh-200px)]">
      <GridItem size="full" item={a} />
      <GridItem size="half" item={b} />
      <GridItem size="half" item={c} />
    </section>
  )
}

/** Infinite horizontal product carousel (duplicated for a seamless loop). */
export function Carousel({ items }: { items: Card[] }) {
  if (!items.length) return null
  const loop = [...items, ...items]
  return (
    <div className="w-full overflow-x-auto pb-6 pt-1">
      <ul className="flex animate-carousel gap-4">
        {loop.map((it, i) => {
          const img = productImage(it.product)
          return (
            <li key={`${it.product.id}-${i}`} className="relative aspect-square h-[30vh] max-h-[275px] w-2/3 max-w-[475px] flex-none md:w-1/3">
              <Link href={`/products/${it.product.slug}`} prefetch className="relative h-full w-full">
                <GridTileImage src={img?.url} alt={img?.alt ?? it.product.title} label={{ title: it.product.title, amount: it.priceFrom }} />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
