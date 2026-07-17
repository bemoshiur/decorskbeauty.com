import type { Homepage } from '@/payload-types'

import { HeroSection } from './blocks/HeroSection'
import { TrustBadgesSection } from './blocks/TrustBadgesSection'
import { FeaturedProductsSection } from './blocks/FeaturedProductsSection'
import { CategoryGridSection } from './blocks/CategoryGridSection'
import { PromoBannerSection } from './blocks/PromoBannerSection'
import { BestSellersSection } from './blocks/BestSellersSection'
import { TestimonialsSection } from './blocks/TestimonialsSection'
import { AuthenticitySection } from './blocks/AuthenticitySection'
import { RichTextSection } from './blocks/RichTextSection'
import { NewsletterSection } from './blocks/NewsletterSection'
import { CtaSection } from './blocks/CtaSection'

type Blocks = NonNullable<Homepage['layout']>

/** Render the admin-ordered homepage blocks. Unknown block types are skipped. */
export function BlockRenderer({ blocks }: { blocks: Blocks }) {
  return (
    <>
      {blocks.map((block) => {
        const key = block.id ?? `${block.blockType}-${Math.random()}`
        switch (block.blockType) {
          case 'hero':
            return <HeroSection key={key} block={block} />
          case 'trustBadges':
            return <TrustBadgesSection key={key} block={block} />
          case 'featuredProducts':
            return <FeaturedProductsSection key={key} block={block} />
          case 'categoryGrid':
            return <CategoryGridSection key={key} block={block} />
          case 'promoBanner':
            return <PromoBannerSection key={key} block={block} />
          case 'bestSellers':
            return <BestSellersSection key={key} block={block} />
          case 'testimonials':
            return <TestimonialsSection key={key} block={block} />
          case 'authenticity':
            return <AuthenticitySection key={key} block={block} />
          case 'richText':
            return <RichTextSection key={key} block={block} />
          case 'newsletter':
            return <NewsletterSection key={key} block={block} />
          case 'cta':
            return <CtaSection key={key} block={block} />
          default:
            return null
        }
      })}
    </>
  )
}
