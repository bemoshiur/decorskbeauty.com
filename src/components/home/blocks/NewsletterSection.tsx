import type { NewsletterBlock } from '@/payload-types'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Reveal } from '@/components/motion/Reveal'

/**
 * Homepage newsletter capture. A single centered glass panel on a soft mesh surface —
 * editorial, generous whitespace, celadon accents. There is no newsletter backend yet, so the
 * form is intentionally presentational: the field is real for layout/a11y, but the button is a
 * `type="button"` no-op (no fake submit, no fabricated success state).
 *
 * Server component — no `use client` here. Entrance motion comes from the <Reveal> client island.
 */
export function NewsletterSection({ block }: { block: NewsletterBlock }) {
  const surface = block.theme ?? 'mesh-bloom'
  const heading = block.heading || 'Restock alerts, straight to your inbox'
  const subheading =
    block.subheading || 'New arrivals, drop dates, and honest skin notes — no noise, just the good stuff.'
  const ctaLabel = block.ctaLabel || 'Subscribe'
  const placeholder = block.placeholder || 'you@email.com'

  return (
    <Section surface={surface} spacing="lg">
      <Reveal className="mx-auto max-w-3xl">
        <div className="relative isolate overflow-hidden rounded-feature bg-cloud/70 p-8 text-center shadow-lift ring-soft glass sm:p-12">
          <span
            className="mx-auto mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-celadon/15 text-celadon-deep ring-1 ring-celadon/25"
            aria-hidden="true"
          >
            <Icon name="sparkles" className="h-6 w-6" />
          </span>

          <h2 className="font-display text-3xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-4xl">
            {heading}
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg line-clamp-3">
            {subheading}
          </p>

          <form
            className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row"
            aria-label="Newsletter signup"
          >
            <input
              type="email"
              name="email"
              inputMode="email"
              autoComplete="email"
              placeholder={placeholder}
              aria-label="Email address"
              className="h-12 w-full flex-1 rounded-full border-0 bg-white/85 px-5 text-[0.95rem] text-ink shadow-soft outline-none ring-1 ring-line transition placeholder:text-grey focus:ring-2 focus:ring-celadon"
            />
            <Button type="button" size="md" className="w-full shrink-0 sm:w-auto">
              {ctaLabel}
            </Button>
          </form>

          <p className="mx-auto mt-4 flex items-center justify-center gap-1.5 text-xs text-grey">
            <Icon name="lock" className="h-3.5 w-3.5" aria-hidden="true" />
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </Reveal>
    </Section>
  )
}
