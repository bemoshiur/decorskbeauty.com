import type { PromoBannerBlock } from '@/payload-types'
import { cn } from '@/lib/cn'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { StoreImage } from '@/components/ui/StoreImage'
import { Icon } from '@/components/ui/Icon'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal'

type Surface = NonNullable<PromoBannerBlock['theme']>

/**
 * Homepage promo banner. A premium split (image beside copy) for the `left`/`right` layouts,
 * or a full-bleed centered panel with the image behind a legibility scrim for `full`.
 * Server component — time-gates itself with the request-time `Date`, then reveals on scroll
 * through the client Reveal islands (no `use client` on this file).
 */
export function PromoBannerSection({ block }: { block: PromoBannerBlock }) {
  // Schedule gating. Runs per request on the server, so `Date` is authoritative here.
  const now = new Date()
  if (block.startAt && new Date(block.startAt) > now) return null
  if (block.endAt && new Date(block.endAt) < now) return null

  const surface: Surface = block.theme ?? 'mesh-bloom'
  const layout = block.layout ?? 'right'
  const cta = block.cta?.href && block.cta?.label ? block.cta : null

  if (layout === 'full') {
    return <FullPanel block={block} surface={surface} cta={cta} />
  }

  const onDark = surface === 'ink'
  // `left` → image occupies the left column; copy sits opposite.
  const imageFirst = layout === 'left'

  return (
    <Section surface={surface} spacing="md">
      <RevealGroup className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <RevealItem className={cn('relative', imageFirst ? 'lg:order-first' : 'lg:order-last')}>
          <div className="overflow-hidden rounded-feature shadow-lift ring-1 ring-white/40">
            <StoreImage
              media={block.image}
              alt={block.heading}
              ratio="landscape"
              sizes="(min-width: 1024px) 46vw, 92vw"
              imgClassName="transition-transform duration-700 ease-out-soft hover:scale-[1.03]"
            />
          </div>
        </RevealItem>

        <RevealItem className={cn('flex flex-col items-start gap-5', imageFirst ? 'lg:order-last' : 'lg:order-first')}>
          {block.eyebrow && (
            <span
              className={cn(
                'text-xs font-semibold uppercase tracking-[0.18em]',
                onDark ? 'text-celadon-soft' : 'text-celadon-deep',
              )}
            >
              {block.eyebrow}
            </span>
          )}
          <h2
            className={cn(
              'font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.75rem]',
              onDark ? 'text-paper' : 'text-ink',
            )}
          >
            {block.heading}
          </h2>
          {block.body && (
            <p className={cn('max-w-xl text-base leading-relaxed sm:text-lg', onDark ? 'text-paper/75' : 'text-ink-soft')}>
              {block.body}
            </p>
          )}
          {cta && (
            <div className="pt-2">
              <Button href={cta.href!} variant={onDark ? 'secondary' : 'primary'} size="lg">
                {cta.label}
                <Icon name="sparkles" className="h-4 w-4" />
              </Button>
            </div>
          )}
        </RevealItem>
      </RevealGroup>
    </Section>
  )
}

/** Full-bleed variant: the image sits behind a celadon-ink scrim with the copy centered on top. */
function FullPanel({
  block,
  surface,
  cta,
}: {
  block: PromoBannerBlock
  surface: Surface
  cta: NonNullable<PromoBannerBlock['cta']> | null
}) {
  return (
    <Section surface={surface} spacing="md">
      <Reveal>
        <div className="relative isolate flex min-h-[22rem] items-center justify-center overflow-hidden rounded-feature bg-celadon-deep shadow-lift sm:min-h-[26rem]">
          {block.image != null && (
            <StoreImage
              media={block.image}
              alt={block.heading}
              ratio="auto"
              sizes="(min-width: 1280px) 1152px, 100vw"
              className="absolute inset-0 h-full w-full"
              imgClassName="h-full w-full object-cover"
            />
          )}
          {/* Legibility scrim — deepens toward the base where the copy anchors. */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-celadon-ink/90 via-celadon-ink/60 to-celadon-ink/35"
            aria-hidden
          />

          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-5 px-6 py-16 text-center sm:px-10 sm:py-20">
            {block.eyebrow && (
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-celadon-soft">{block.eyebrow}</span>
            )}
            <h2 className="font-display text-3xl font-semibold leading-[1.1] tracking-tight text-paper sm:text-4xl lg:text-5xl">
              {block.heading}
            </h2>
            {block.body && (
              <p className="max-w-xl text-base leading-relaxed text-paper/80 sm:text-lg line-clamp-4">{block.body}</p>
            )}
            {cta && (
              <div className="pt-2">
                <Button href={cta.href!} variant="secondary" size="lg">
                  {cta.label}
                  <Icon name="sparkles" className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </Reveal>
    </Section>
  )
}
