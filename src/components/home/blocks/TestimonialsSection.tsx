import type { TestimonialsBlock } from '@/payload-types'
import { cn } from '@/lib/cn'
import { listApprovedTestimonials } from '@/lib/commerce'
import { Section } from '@/components/ui/Section'
import { Icon } from '@/components/ui/Icon'
import { StoreImage } from '@/components/ui/StoreImage'
import { SectionHeading } from '@/components/home/SectionHeading'
import { RevealGroup, RevealItem } from '@/components/motion/Reveal'

/** Five-slot rating row. Filled slots use celadon; the rest sit muted for editorial rhythm. */
function Stars({ rating }: { rating: number }) {
  const filled = Math.round(Math.min(5, Math.max(0, rating)))
  return (
    <div className="flex items-center gap-1" role="img" aria-label={`Rated ${filled} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Icon
          key={i}
          name="star"
          className={cn('h-4 w-4', i < filled ? 'fill-celadon text-celadon' : 'fill-none text-grey/40')}
        />
      ))}
    </div>
  )
}

/**
 * Marketing social proof — a masonry-ish grid of approved, featured testimonials.
 * NOTE (#12): these render for persuasion only. Never emit AggregateRating / review JSON-LD from here.
 * Returns null when there is no real approved content — we never fabricate reviews.
 */
export async function TestimonialsSection({ block }: { block: TestimonialsBlock }) {
  const testimonials = await listApprovedTestimonials({ featuredOnly: true, limit: 9 })
  if (testimonials.length === 0) return null

  return (
    <Section surface={block.theme ?? 'mesh-mint'} spacing="lg">
      <SectionHeading
        eyebrow={block.heading ? 'Loved in Dhaka' : undefined}
        title={block.heading ?? 'What our customers say'}
        subtitle={block.subheading}
        align="center"
      />

      <RevealGroup className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t) => (
          <RevealItem key={t.id} className="h-full">
            <figure className="flex h-full flex-col gap-4 rounded-card bg-cloud/80 p-6 shadow-soft ring-soft backdrop-blur-sm transition-shadow duration-300 ease-out-soft hover:shadow-lift">
              <Stars rating={t.rating ?? 5} />

              <blockquote className="flex-1 text-[15px] italic leading-relaxed text-ink-soft">
                <p className="line-clamp-5">&ldquo;{t.quote}&rdquo;</p>
              </blockquote>

              <figcaption className="mt-1 flex items-center gap-3 border-t border-ink/5 pt-4">
                <StoreImage
                  media={t.avatar ?? undefined}
                  alt={t.name}
                  ratio="square"
                  sizes="40px"
                  className="h-10 w-10 shrink-0 rounded-full ring-1 ring-ink/5"
                />
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold text-ink">{t.name}</p>
                  {t.location && <p className="truncate text-xs text-grey">{t.location}</p>}
                </div>
              </figcaption>
            </figure>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  )
}
