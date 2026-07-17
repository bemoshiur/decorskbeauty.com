import { BadgeCheck, MessageSquareText } from 'lucide-react'

import type { ReviewCard, ReviewSummary, RatingKey } from '@/lib/commerce/reviews'
import { Section } from '@/components/ui/Section'
import { SectionHeading } from '@/components/home/SectionHeading'
import { ReviewStars } from './ReviewStars'
import { ReviewForm } from './ReviewForm'

const fmtDate = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function DistributionBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs text-ink-soft">
      <span className="w-6 shrink-0 text-right font-mono">{star}★</span>
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-mist">
        <span className="block h-full rounded-full bg-honey" style={{ width: `${pct}%` }} />
      </span>
      <span className="w-8 shrink-0 text-right font-mono text-grey">{count}</span>
    </div>
  )
}

/**
 * PDP reviews section. Renders the AggregateRating summary + approved reviews ONLY when real ones exist
 * (#12) — otherwise a genuine empty state that invites the first review. The submission form is always
 * available. All display data is the phone-free DTO from listApprovedReviews.
 */
export function ProductReviews({
  slug,
  summary,
  reviews,
}: {
  slug: string
  summary: ReviewSummary
  reviews: ReviewCard[]
}) {
  const has = summary.count > 0

  return (
    <Section id="reviews" surface="cloud" spacing="md">
      <SectionHeading eyebrow="Reviews" title="What customers say" align="left" className="mb-8" />

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
        {/* Left: summary + list (or empty state) */}
        <div className="flex flex-col gap-6">
          {has ? (
            <>
              <div className="flex flex-col gap-4 rounded-card bg-paper p-5 ring-1 ring-line sm:flex-row sm:items-center sm:gap-8">
                <div className="flex flex-col items-center justify-center border-line sm:border-r sm:pr-8">
                  <span className="font-display text-5xl font-semibold text-ink">{summary.average.toFixed(1)}</span>
                  <ReviewStars rating={summary.average} size="md" className="mt-1" />
                  <span className="mt-1 text-xs text-grey">{summary.count} review{summary.count === 1 ? '' : 's'}</span>
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  {([5, 4, 3, 2, 1] as RatingKey[]).map((s) => (
                    <DistributionBar key={s} star={s} count={summary.distribution[s]} total={summary.count} />
                  ))}
                </div>
              </div>

              <ul className="flex flex-col gap-4">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-card bg-paper p-5 ring-1 ring-line">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <ReviewStars rating={r.rating} size="sm" />
                        {r.title && <p className="mt-1.5 font-display text-lg font-semibold leading-snug text-ink">{r.title}</p>}
                      </div>
                      {fmtDate(r.createdAt) && <span className="shrink-0 font-mono text-xs text-grey">{fmtDate(r.createdAt)}</span>}
                    </div>
                    <p className="mt-2 whitespace-pre-line text-[0.95rem] leading-relaxed text-ink-soft">{r.body}</p>
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <span className="font-medium text-ink">{r.authorName}</span>
                      {r.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-celadon/15 px-2 py-0.5 text-xs font-medium text-celadon-deep">
                          <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                          Verified purchase
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-card bg-paper p-10 text-center ring-1 ring-line">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mist text-celadon-deep">
                <MessageSquareText className="h-6 w-6" aria-hidden />
              </span>
              <p className="font-display text-xl text-ink">No reviews yet</p>
              <p className="max-w-sm text-sm text-ink-soft">Be the first to review this product. Your honest experience helps other shoppers choose with confidence.</p>
            </div>
          )}
        </div>

        {/* Right: submission form */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ReviewForm slug={slug} />
        </div>
      </div>
    </Section>
  )
}
