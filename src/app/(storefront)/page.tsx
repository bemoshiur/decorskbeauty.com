import type { Metadata } from 'next'

import { getHomepage, listProductCards } from '@/lib/commerce'
import { JsonLd } from '@/components/JsonLd'
import { BlockRenderer } from '@/components/home/BlockRenderer'
import { Button } from '@/components/ui/Button'
import { graph, localBusiness, itemList } from '@/lib/seo/jsonld'

export const revalidate = 300

export const metadata: Metadata = { alternates: { canonical: '/' } }

export default async function HomePage() {
  const [homepage, cards] = await Promise.all([getHomepage(), listProductCards()])
  const blocks = homepage?.layout ?? []

  return (
    <>
      <JsonLd data={graph(localBusiness(), itemList(cards.map((c) => c.product)))} />
      {blocks.length ? (
        <BlockRenderer blocks={blocks} />
      ) : (
        <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-28 text-center">
          <h1 className="font-display text-4xl font-semibold text-ink">Decor&apos;s K-Beauty</h1>
          <p className="mt-4 max-w-md text-ink-soft">100% authentic Korean skincare & haircare, delivered across Bangladesh. The homepage is being set up.</p>
          <div className="mt-8">
            <Button href="/search" size="lg">Browse all products</Button>
          </div>
        </div>
      )}
    </>
  )
}
