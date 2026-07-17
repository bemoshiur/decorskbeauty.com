import type { CategoryGridBlock, Category } from '@/payload-types'
import { cn } from '@/lib/cn'
import { Section } from '@/components/ui/Section'
import { StoreImage } from '@/components/ui/StoreImage'
import { SectionHeading } from '@/components/home/SectionHeading'
import { RevealGroup, RevealItem } from '@/components/motion/Reveal'
import { listFeaturedCategories } from '@/lib/commerce'
import Link from 'next/link'

/** Bottom-left accent tint per category — the token wash that colours the scrim (#1). Static class
 *  strings so Tailwind keeps them; never interpolate a token name into a class. */
const ACCENT_TINT: Record<NonNullable<Category['accent']>, string> = {
  celadon: 'from-celadon/55',
  sky: 'from-sky/55',
  apricot: 'from-apricot/55',
  'rose-clay': 'from-rose-clay/55',
  lilac: 'from-lilac/55',
}

/**
 * Homepage category grid. Renders the owner-picked tiles (or the featured-on-home fallback) as an
 * editorial bento/grid of image tiles that deep-link into search. Server component: reads through
 * lib/commerce (#13), stays decoupled from Payload's Local API. Entrance motion via Reveal islands.
 */
export async function CategoryGridSection({ block }: { block: CategoryGridBlock }) {
  // Prefer explicit picks (populated objects at depth 2); else the featured-on-home set.
  const categories: Category[] = block.categories?.length
    ? block.categories.filter((c): c is Category => typeof c === 'object')
    : await listFeaturedCategories(6)

  if (categories.length === 0) return null

  const isBento = block.layout === 'bento'

  // Fixed row tracks let tiles fill (images are absolutely positioned) and let the bento hero span 2×2.
  const gridClass = isBento
    ? 'grid grid-cols-1 auto-rows-[13rem] gap-4 sm:grid-cols-2 sm:auto-rows-[14.5rem] sm:gap-5 lg:grid-cols-3 lg:auto-rows-[15.5rem]'
    : 'grid grid-cols-1 auto-rows-[13rem] gap-4 sm:grid-cols-2 sm:auto-rows-[15rem] sm:gap-5 lg:grid-cols-3 lg:auto-rows-[16rem]'

  return (
    <Section surface={block.theme ?? 'mist'} spacing="lg">
      <SectionHeading eyebrow="Explore" title={block.heading} subtitle={block.subheading} align="center" />

      <RevealGroup as="ul" className={cn(gridClass, 'mt-12 sm:mt-16')}>
        {categories.map((cat, i) => {
          const hero = isBento && i === 0
          const media = cat.tileImage || cat.image
          const href = cat.slug ? `/search?category=${encodeURIComponent(cat.slug)}` : '/search'
          const tint = ACCENT_TINT[cat.accent ?? 'celadon']

          return (
            <RevealItem
              as="li"
              key={cat.id}
              className={cn('group list-none', hero && 'sm:col-span-2 lg:col-span-2 lg:row-span-2')}
            >
              <Link
                href={href}
                className="relative block h-full min-h-[11rem] overflow-hidden rounded-feature shadow-soft ring-soft transition-shadow duration-300 ease-out-soft hover:shadow-lift"
              >
                <StoreImage
                  media={media}
                  alt={`${cat.name} collection`}
                  ratio="auto"
                  className="absolute inset-0 h-full w-full"
                  imgClassName="transition-transform duration-700 ease-out-soft group-hover:scale-105"
                  sizes={
                    hero
                      ? '(min-width: 1024px) 42rem, (min-width: 640px) 100vw, 100vw'
                      : '(min-width: 1024px) 21rem, (min-width: 640px) 50vw, 100vw'
                  }
                />

                {/* Clean bottom scrim for legibility (single gradient — no muddy mid-tone) */}
                <div className="absolute inset-0 bg-gradient-to-t from-celadon-ink/85 to-transparent" aria-hidden />
                {/* Soft accent glow, top-right only — tints the tile without washing the whole image */}
                <div className={cn('absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br to-transparent opacity-80 blur-2xl', tint)} aria-hidden />

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 sm:p-6">
                  <h3
                    className={cn(
                      'font-display font-semibold leading-tight tracking-tight text-paper drop-shadow-sm',
                      hero ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl',
                    )}
                  >
                    {cat.name}
                  </h3>
                  <span
                    className="glass flex h-9 w-9 flex-none translate-y-1 items-center justify-center rounded-full text-celadon-deep opacity-0 transition-all duration-300 ease-out-soft group-hover:translate-y-0 group-hover:opacity-100"
                    aria-hidden
                  >
                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" strokeWidth={2} stroke="currentColor">
                      <path d="M4 10h11M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </Link>
            </RevealItem>
          )
        })}
      </RevealGroup>
    </Section>
  )
}
