import type { Metadata } from 'next'

import { listProductCards } from '@/lib/commerce'
import { JsonLd } from '@/components/JsonLd'
import { ThreeItemGrid, Carousel } from '@/components/commerce/home-sections'
import { graph, localBusiness, itemList } from '@/lib/seo/jsonld'

export const revalidate = 300

export const metadata: Metadata = { alternates: { canonical: '/' } }

export default async function HomePage() {
  const cards = await listProductCards()

  return (
    <>
      <JsonLd data={graph(localBusiness(), itemList(cards.map((c) => c.product)))} />
      {cards.length >= 3 ? (
        <>
          <ThreeItemGrid items={cards.slice(0, 3)} />
          <Carousel items={cards.slice(3)} />
        </>
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-20 text-center text-neutral-500">The catalog is being stocked. Check back shortly.</div>
      )}
    </>
  )
}
