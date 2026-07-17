import type { BestSellersBlock, Product } from '@/payload-types'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { ProductCard } from '@/components/shop/ProductCard'
import { SectionHeading } from '@/components/home/SectionHeading'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal'
import { listBestSellers, listProductCardsByIds } from '@/lib/commerce'

const toId = (p: number | Product): number => (typeof p === 'object' ? p.id : p)

/**
 * Best sellers — a merchandising rail of the shop's most-loved products.
 * Curated (block.products) or auto-filled from the best-seller flag. Cards carry their own
 * "Best seller" badge. Mobile: a full-bleed snap carousel. lg+: a four-up grid.
 * Server component; entrance motion comes from the Reveal client islands.
 */
export async function BestSellersSection({ block }: { block: BestSellersBlock }) {
  const curated = block.products?.map(toId) ?? []
  const cards = curated.length ? await listProductCardsByIds(curated) : await listBestSellers(8)

  if (!cards.length) return null

  const surface = block.theme ?? 'paper'
  const onDark = surface === 'ink'

  return (
    <Section surface={surface} containerSize="wide">
      <div className="flex flex-col gap-8 sm:gap-10">
        {/* Header row: heading left, a quiet "shop all" affordance to the right on wide screens. */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Bestsellers"
            title={block.heading ?? 'Loved by our customers'}
            subtitle={block.subheading}
            align="left"
            onDark={onDark}
          />
          <Reveal delay={0.1} className="shrink-0">
            <Button href="/products" variant="secondary" size="sm">
              Shop all
              <Icon name="sparkles" className="h-4 w-4" />
            </Button>
          </Reveal>
        </div>

        {/* Mobile: full-bleed horizontal snap carousel. lg+: 4-column grid. Scrollbar hidden tastefully. */}
        <RevealGroup
          className={
            '-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 ' +
            'sm:-mx-6 sm:px-6 ' +
            'lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0 ' +
            '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
          }
          amount={0.15}
        >
          {cards.map((card) => (
            <RevealItem
              key={card.product.id}
              className="min-w-[70%] shrink-0 snap-start sm:min-w-[40%] lg:min-w-0 lg:shrink"
            >
              <ProductCard
                data={card}
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 40vw, 70vw"
              />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </Section>
  )
}
