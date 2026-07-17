'use client'

import { useState } from 'react'
import { Star, CheckCircle2, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/cn'

type State = 'idle' | 'sending' | 'done' | 'error'

/**
 * Customer review submission. Posts to /api/reviews, which always stores the review as `pending` — it
 * only appears after the owner approves it (#12). Phone is optional; when given it lets us mark the
 * review as a verified purchase. Fully keyboard-accessible star picker.
 */
export function ReviewForm({ slug }: { slug: string }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [state, setState] = useState<State>('idle')
  const [msg, setMsg] = useState('')
  const [verified, setVerified] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1) {
      setState('error')
      setMsg('Please choose a star rating.')
      return
    }
    setState('sending')
    setMsg('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, rating, title, body, authorName: name, phone }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; verified?: boolean }
      if (!res.ok || !data.ok) {
        setState('error')
        setMsg(data.error ?? 'Could not submit your review. Please try again.')
        return
      }
      setVerified(Boolean(data.verified))
      setState('done')
    } catch {
      setState('error')
      setMsg('Network error — please check your connection and try again.')
    }
  }

  if (state === 'done') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card bg-cloud p-8 text-center ring-1 ring-line">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-celadon/15 text-celadon-deep">
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </span>
        <p className="font-display text-xl text-ink">Thank you for your review</p>
        <p className="max-w-sm text-sm text-ink-soft">
          {verified ? 'We matched it to your order — thanks for being a customer! ' : ''}
          Your review will appear here once our team has checked it.
        </p>
      </div>
    )
  }

  const activeStars = hover || rating

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-card bg-cloud p-5 ring-1 ring-line sm:p-6">
      <div>
        <h3 className="font-display text-xl font-semibold text-ink">Write a review</h3>
        <p className="mt-1 text-sm text-ink-soft">Bought this product? Share your experience to help others.</p>
      </div>

      {/* Star picker */}
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">Your rating</legend>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating out of 5">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={rating === i}
              aria-label={`${i} star${i === 1 ? '' : 's'}`}
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(0)}
              className="rounded-md p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-celadon"
            >
              <Star className={cn('h-7 w-7', i <= activeStars ? 'fill-honey text-honey' : 'fill-transparent text-line')} aria-hidden />
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            autoComplete="name"
            className="h-11 rounded-xl bg-paper px-3 text-ink ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-celadon"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">Phone <span className="font-normal text-grey">(optional)</span></span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder="01XXXXXXXXX"
            className="h-11 rounded-xl bg-paper px-3 font-mono text-ink ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-celadon"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-ink">Headline <span className="font-normal text-grey">(optional)</span></span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Sums up your experience"
          className="h-11 rounded-xl bg-paper px-3 text-ink ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-celadon"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-ink">Your review</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          placeholder="How did it work for your skin? Would you buy it again?"
          className="rounded-xl bg-paper p-3 text-ink ring-1 ring-line focus:outline-none focus-visible:ring-2 focus-visible:ring-celadon"
        />
      </label>

      {state === 'error' && (
        <p role="alert" className="text-sm font-medium text-seal">{msg}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs text-grey">
          <ShieldCheck className="h-3.5 w-3.5 text-celadon-deep" aria-hidden />
          Reviews are checked before they appear.
        </p>
        <button
          type="submit"
          disabled={state === 'sending'}
          className="grad-cta inline-flex h-11 items-center justify-center rounded-full px-7 text-sm font-semibold text-white shadow-lift transition-shadow hover:shadow-glow disabled:opacity-60"
        >
          {state === 'sending' ? 'Submitting…' : 'Submit review'}
        </button>
      </div>
    </form>
  )
}
