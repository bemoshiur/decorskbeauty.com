import type { FeaturedProductsBlock } from '@/payload-types'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { SectionHeading } from '@/components/home/SectionHeading'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal'
import { ProductCard } from '@/components/shop/ProductCard'
import { listFeaturedProducts, listProductCardsByIds } from '@/lib/commerce'

/**
 * Homepage "Featured products" block.
 *
 * Server component — data is read through the commerce layer (§13, never `payload.find()`
 * directly). Entrance motion is delegated to the Reveal client islands, so this file stays
 * an RSC. Renders a curated, ordered selection when the editor picked products; otherwise
 * auto-fills from the featured/best-seller flags. Renders nothing when there is no catalog
 * to show, so an empty section never ships to the page.
 */
export async function FeaturedProductsSection({ block }: { block: FeaturedProductsBlock }) {
  const ids = block.products?.length
    ? block.products.map((p) => (typeof p === 'object' ? p.id : p))
    : null

  const cards = ids ? await listProductCardsByIds(ids) : await listFeaturedProducts(8)
  if (!cards.length) return null

  const theme = block.theme ?? 'paper'
  const onDark = theme === 'ink'
  const viewAll = block.viewAll?.href && block.viewAll?.label ? block.viewAll : null

  return (
    <Section surface={theme} spacing="lg">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <SectionHeading
          align="left"
          title={block.heading}
          subtitle={block.subheading}
          onDark={onDark}
          className="max-w-2xl"
        />
        {viewAll && (
          <Reveal delay={0.12} className="shrink-0">
            <Button href={viewAll.href!} variant={onDark ? 'secondary' : 'ghost'} size="md">
              {viewAll.label}
              <span aria-hidden="true">&rarr;</span>
            </Button>
          </Reveal>
        )}
      </div>

      <RevealGroup
        as="ul"
        className="mt-10 grid grid-cols-2 gap-5 sm:mt-12 md:grid-cols-3 lg:grid-cols-4"
      >
        {cards.map((card) => (
          <RevealItem key={card.product.id} as="li" className="flex [&>a]:h-full [&>a]:w-full">
            <ProductCard
              data={card}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            />
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  )
}
