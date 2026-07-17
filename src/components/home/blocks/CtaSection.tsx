import type { CtaBlock } from '@/payload-types'
import { cn } from '@/lib/cn'
import { Section } from '@/components/ui/Section'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { RevealGroup, RevealItem } from '@/components/motion/Reveal'

/**
 * Closing call-to-action band for the homepage. A centered, editorial CTA with a large display
 * heading, supporting line, and up to two actions. On the `ink` surface the primary flips to the
 * light `secondary` pill so it pops against the dark band; on light surfaces it keeps the celadon
 * `grad-cta`. Server component — decorative aurora glows are pure CSS and the copy reveals through
 * the client Reveal islands, so no `use client` here.
 */
export function CtaSection({ block }: { block: CtaBlock }) {
  const surface = block.theme ?? 'ink'
  const onDark = surface === 'ink'

  const primary = block.primaryCta?.href && block.primaryCta?.label ? block.primaryCta : null
  const secondary = block.secondaryCta?.href && block.secondaryCta?.label ? block.secondaryCta : null

  return (
    <Section surface={surface} spacing="lg" container={false} className="overflow-hidden">
      {/* Subtle decorative aurora — presentational only. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,var(--color-celadon),transparent_65%)] opacity-40 blur-3xl"
        />
        <div
          className="absolute -bottom-32 right-[10%] h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,var(--color-sky),transparent_65%)] opacity-30 blur-3xl"
        />
      </div>

      <Container>
        <RevealGroup className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center sm:gap-7">
          <RevealItem
            as="h2"
            className={cn(
              'font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.5rem]',
              onDark ? 'text-paper' : 'text-ink',
            )}
          >
            {block.heading}
          </RevealItem>

          {block.subheading && (
            <RevealItem
              as="p"
              className={cn(
                'max-w-2xl text-base leading-relaxed line-clamp-3 sm:text-lg',
                onDark ? 'text-paper/80' : 'text-ink-soft',
              )}
            >
              {block.subheading}
            </RevealItem>
          )}

          {(primary || secondary) && (
            <RevealItem className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {primary && (
                <Button href={primary.href!} variant={onDark ? 'secondary' : 'primary'} size="lg">
                  {primary.label}
                  <Icon name="sparkles" className="h-4 w-4" />
                </Button>
              )}
              {secondary && (
                <Button
                  href={secondary.href!}
                  variant={onDark ? 'ghost' : 'secondary'}
                  size="lg"
                  className={cn(onDark && 'text-paper ring-1 ring-white/25 hover:bg-white/10 hover:text-paper')}
                >
                  {secondary.label}
                </Button>
              )}
            </RevealItem>
          )}
        </RevealGroup>
      </Container>
    </Section>
  )
}
