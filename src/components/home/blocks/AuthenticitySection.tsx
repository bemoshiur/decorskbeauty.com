import type { AuthenticityBlock } from '@/payload-types'
import { cn } from '@/lib/cn'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { StoreImage } from '@/components/ui/StoreImage'
import { SectionHeading } from '@/components/home/SectionHeading'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal'
import { scaleIn } from '@/components/motion/variants'

// Sample evidential lines for the authenticity slip. Static, illustrative — the real batch/expiry
// data lives on each PDP's slip; here it exists to *show* what "verifiable" looks like.
const SLIP_ROWS: { k: string; v: string }[] = [
  { k: 'Batch', v: 'KB-2406-1128' },
  { k: 'MFG', v: '2024 · 06' },
  { k: 'EXP', v: '2027 · 05' },
  { k: 'Import Lot', v: 'DKB-LOT-0428' },
]

/**
 * The brand argument — "proof before persuasion". A deep-green section pairing the authenticity
 * promise (copy + a verify CTA) with a monospace receipt/slip that renders the evidence itself.
 * Server component: entrance motion comes from the Reveal client islands, not a page-level 'use client'.
 */
export function AuthenticitySection({ block }: { block: AuthenticityBlock }) {
  const surface = block.theme ?? 'ink'
  const onDark = surface === 'ink'
  const points = block.points ?? []
  const verify = block.verifyCta

  return (
    <Section surface={surface} spacing="lg">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Copy — the promise */}
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow={block.eyebrow}
            title={block.heading}
            align="left"
            onDark={onDark}
          />

          {block.body && (
            <Reveal delay={0.05}>
              <p
                className={cn(
                  'max-w-xl text-base leading-relaxed sm:text-lg',
                  onDark ? 'text-paper/80' : 'text-ink-soft',
                )}
              >
                {block.body}
              </p>
            </Reveal>
          )}

          {points.length > 0 && (
            <RevealGroup as="ul" className="flex flex-col gap-3.5">
              {points.map((p, i) => (
                <RevealItem
                  as="li"
                  key={p.id ?? i}
                  className="flex items-start gap-3"
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1',
                      onDark
                        ? 'bg-celadon/20 text-celadon-soft ring-celadon/30'
                        : 'bg-celadon/15 text-celadon-deep ring-celadon/25',
                    )}
                  >
                    <Icon name="badge-check" className="h-4 w-4" />
                  </span>
                  <span
                    className={cn(
                      'text-[0.95rem] leading-relaxed line-clamp-2',
                      onDark ? 'text-paper/90' : 'text-ink',
                    )}
                  >
                    {p.text}
                  </span>
                </RevealItem>
              ))}
            </RevealGroup>
          )}

          {verify?.href && verify?.label && (
            <Reveal delay={0.1}>
              <Button href={verify.href} variant="secondary" size="lg">
                <Icon name="shield-check" className="h-5 w-5" />
                {verify.label}
              </Button>
            </Reveal>
          )}
        </div>

        {/* Evidence — the slip (or a supplied image) */}
        <Reveal variants={scaleIn} amount={0.25} className="lg:justify-self-end">
          {block.image ? (
            <div className="overflow-hidden rounded-feature shadow-lift ring-1 ring-white/15">
              <StoreImage
                media={block.image}
                alt={block.heading ?? 'Authenticity guarantee'}
                ratio="portrait"
                sizes="(min-width: 1024px) 42vw, 90vw"
                className="w-full"
              />
            </div>
          ) : (
            <figure
              className="relative mx-auto w-full max-w-md overflow-hidden rounded-card bg-paper p-6 text-ink shadow-lift ring-1 ring-black/[0.04] sm:p-8"
              aria-label="Sample authenticity slip"
            >
              {/* header */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-grey">
                  Authenticity Slip
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-celadon-deep text-paper">
                  <Icon name="shield-check" className="h-5 w-5" />
                </span>
              </div>

              <div className="my-5 border-t border-dashed border-ink/15" aria-hidden />

              {/* evidential rows with dotted leaders */}
              <dl className="space-y-3.5 font-mono text-sm">
                {SLIP_ROWS.map((r) => (
                  <div key={r.k} className="flex items-baseline gap-3">
                    <dt className="shrink-0 uppercase tracking-wide text-grey">{r.k}</dt>
                    <span
                      className="min-w-6 flex-1 border-b border-dotted border-ink/25"
                      aria-hidden
                    />
                    <dd className="shrink-0 font-medium text-ink">{r.v}</dd>
                  </div>
                ))}
              </dl>

              {/* footer + verified stamp */}
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-dashed border-ink/15 pt-5">
                <span className="font-mono text-[11px] leading-relaxed text-grey">
                  Scan · verify · decorskbeauty.com
                </span>
                <span className="inline-flex -rotate-3 items-center gap-1.5 rounded-md border-2 border-seal/50 px-3 py-1 font-mono text-sm font-bold uppercase tracking-wider text-seal">
                  <span aria-hidden>✓</span> Verified
                </span>
              </div>
            </figure>
          )}
        </Reveal>
      </div>
    </Section>
  )
}
