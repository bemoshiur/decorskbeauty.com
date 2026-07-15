'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Zone = 'dhakaCity' | 'dhakaSub' | 'outside'
type Terms = { subtotal: number; deliveryCharge: number; grandTotal: number; advanceRequired: number; codAmount: number; reason: string[] }
type Interstitial = { payUrl: string; android: string; ios: string }

const ZONES: { value: Zone; label: string }[] = [
  { value: 'dhakaCity', label: 'Dhaka City (৳80)' },
  { value: 'dhakaSub', label: 'Dhaka Sub-urban (৳110)' },
  { value: 'outside', label: 'Outside Dhaka (৳140)' },
]
const bdt = (n: number) => `৳${n.toLocaleString('en-US')}`
const WA_NUMBER = '8801712113032'

/**
 * On-PDP order form (redesign). Numbers come only from /api/checkout/quote → computeCheckoutTerms (#3).
 * Confirm → inline OTP (§17.1) → /api/checkout/quick → COD confirms, an advance routes to EPS, and a
 * Facebook in-app browser gets the intent:// / x-safari escape links (§13.5). Once the phone is
 * verified, a failed placement retries placement directly (never re-consumes the OTP).
 */
export function OrderForm({ variantId, unitPrice, productTitle, sku, preorder }: { variantId: number; unitPrice: number; productTitle: string; sku: string; preorder?: boolean }) {
  const [qty, setQty] = useState(1)
  const [zone, setZone] = useState<Zone>('dhakaCity')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [terms, setTerms] = useState<Terms | null>(null)
  const [step, setStep] = useState<'form' | 'otp' | 'interstitial'>('form')
  const [code, setCode] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const [interstitial, setInterstitial] = useState<Interstitial | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Live quote, guarded against out-of-order responses (only the latest edit's terms win).
  const seq = useRef(0)
  const quoteFor = useCallback(async (q: number, z: Zone) => {
    const my = ++seq.current
    try {
      const r = await fetch('/api/checkout/quote', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ variantId, qty: q, zone: z }) })
      const j = await r.json()
      if (my === seq.current && j.ok) setTerms(j.terms as Terms)
    } catch {
      /* keep last terms */
    }
  }, [variantId])

  const t = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    if (t.current) clearTimeout(t.current)
    t.current = setTimeout(() => quoteFor(qty, zone), 150)
    return () => {
      if (t.current) clearTimeout(t.current)
    }
  }, [qty, zone, quoteFor])

  const waHref = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Hi, I'd like to order: ${productTitle} — SKU ${sku} × ${qty}`)}`

  const place = useCallback(async () => {
    setBusy(true)
    setError('')
    try {
      const r = await fetch('/api/checkout/quick', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ variantId, qty, name, address, zone, paymentChoice: 'cod' }),
      })
      const j = await r.json()
      if (!j.ok) { setError(j.error || 'Could not place the order.'); setBusy(false); return }
      if (j.interstitial) { setInterstitial({ payUrl: j.payUrl, android: j.android, ios: j.ios }); setStep('interstitial'); setBusy(false); return } // FB webview escape (§13.5)
      if (j.redirectUrl) { window.location.href = j.redirectUrl; return } // EPS hosted checkout
      if (j.redirect) { window.location.href = j.redirect; return } // COD success
      setBusy(false)
    } catch {
      setError('Network error. Please try again.')
      setBusy(false)
    }
  }, [variantId, qty, name, address, zone])

  async function onConfirm(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !address.trim()) return setError('Please add your name and full address.')
    if (!/^01\d{9}$/.test(phone.replace(/\s|-/g, ''))) return setError('Enter a valid 11-digit mobile number (01XXXXXXXXX).')
    setBusy(true)
    try {
      const r = await fetch('/api/otp/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone }) })
      const j = await r.json()
      if (!j.ok) { setError(j.error || 'Could not send the code.'); setBusy(false); return }
      setStep('otp')
      setNotice(`We sent a 6-digit code to ${phone}.`)
    } catch {
      setError('Network error. Please try again.')
    }
    setBusy(false)
  }

  // On the OTP step: verify once, then place. If already verified (a retry after a failed placement),
  // go straight to place() — never re-consume the OTP.
  async function onOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (otpVerified) return place()
    setBusy(true)
    try {
      const r = await fetch('/api/otp/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone, code }) })
      const j = await r.json()
      if (!j.ok) { setError(j.error || 'Incorrect code.'); setBusy(false); return }
      setOtpVerified(true)
      await place()
    } catch {
      setError('Network error. Please try again.')
      setBusy(false)
    }
  }

  const field = 'w-full rounded-[4px] border border-grey/40 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-celadon-deep focus-visible:ring-2 focus-visible:ring-celadon-deep/40'
  const stepBtn = 'grid h-11 w-11 place-items-center rounded-[4px] border border-grey/40 text-lg text-ink'

  return (
    <section id="order-form" className="rounded-[8px] border border-celadon/40 bg-celadon/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">{preorder ? 'Pre-order now' : 'Order now — Cash on Delivery'}</h2>
        <div className="flex items-center gap-2" role="group" aria-label="Quantity">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className={stepBtn} aria-label="Decrease quantity">−</button>
          <span className="w-8 text-center font-mono tabular-nums text-ink" aria-live="polite">{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} className={stepBtn} aria-label="Increase quantity">+</button>
        </div>
      </div>

      {step === 'interstitial' && interstitial ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink">You&apos;re in the Facebook browser. To pay securely, open this in your phone&apos;s browser:</p>
          <a href={interstitial.android} className="w-full rounded-[4px] bg-celadon-deep px-5 py-3 text-center text-sm font-semibold text-paper">Open in Chrome (Android)</a>
          <a href={interstitial.ios} className="w-full rounded-[4px] border border-celadon-deep px-5 py-3 text-center text-sm font-medium text-celadon-deep">Open in Safari (iPhone)</a>
          <p className="break-all text-center text-[11px] text-ink/70">Or copy this link: {interstitial.payUrl}</p>
        </div>
      ) : step === 'form' ? (
        <form onSubmit={onConfirm} className="flex flex-col gap-2.5">
          <label className="sr-only" htmlFor="of-name">Your name</label>
          <input id="of-name" className={field} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          <label className="sr-only" htmlFor="of-phone">Mobile number</label>
          <input id="of-phone" className={field} placeholder="Mobile number (01XXXXXXXXX)" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" autoComplete="tel" required />
          <label className="sr-only" htmlFor="of-address">Full delivery address</label>
          <textarea id="of-address" className={field} placeholder="Full delivery address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} autoComplete="street-address" required />
          <label className="sr-only" htmlFor="of-zone">Delivery area</label>
          <select id="of-zone" className={field} value={zone} onChange={(e) => setZone(e.target.value as Zone)}>
            {ZONES.map((z) => <option key={z.value} value={z.value}>{z.label}</option>)}
          </select>

          {terms && (
            <dl className="mt-1 space-y-1 rounded-[4px] bg-white/70 p-3 font-mono text-xs text-ink">
              <div className="flex justify-between"><dt className="text-ink/70">Subtotal</dt><dd>{bdt(terms.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/70">Delivery</dt><dd>{terms.deliveryCharge === 0 ? 'Free' : bdt(terms.deliveryCharge)}</dd></div>
              {terms.advanceRequired > 0 && <div className="flex justify-between text-celadon-deep"><dt>Advance (online)</dt><dd>{bdt(terms.advanceRequired)}</dd></div>}
              <div className="flex justify-between border-t border-grey/20 pt-1 font-semibold"><dt>{terms.advanceRequired > 0 ? 'Pay on delivery' : 'Total (COD)'}</dt><dd>{bdt(terms.codAmount)}</dd></div>
            </dl>
          )}

          {error && <p className="text-xs font-medium text-seal" role="alert">{error}</p>}

          <button type="submit" disabled={busy} className="mt-1 min-h-11 w-full rounded-[4px] bg-celadon-deep px-5 py-3 text-sm font-semibold text-paper transition-colors hover:bg-celadon disabled:opacity-60">
            {busy ? 'Please wait…' : terms && terms.advanceRequired > 0 ? `Confirm — pay ${bdt(terms.advanceRequired)} advance` : 'Confirm Order (Cash on Delivery)'}
          </button>
          <p className="text-center text-[11px] text-ink/70">We&apos;ll text a code to confirm your number — no account needed.</p>
        </form>
      ) : (
        <form onSubmit={onOtpSubmit} className="flex flex-col gap-2.5">
          <p className="text-xs text-celadon-deep" aria-live="polite">{otpVerified ? 'Number verified — placing your order.' : notice}</p>
          {!otpVerified && (
            <>
              <label className="sr-only" htmlFor="of-otp">6-digit code</label>
              <input id="of-otp" className={`${field} text-center font-mono text-lg tracking-[0.4em]`} placeholder="______" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoFocus maxLength={6} />
            </>
          )}
          {error && <p className="text-xs font-medium text-seal" role="alert">{error}</p>}
          <button type="submit" disabled={busy || (!otpVerified && code.length < 6)} className="min-h-11 w-full rounded-[4px] bg-celadon-deep px-5 py-3 text-sm font-semibold text-paper disabled:opacity-60">
            {busy ? 'Please wait…' : otpVerified ? 'Try again' : 'Verify & place order'}
          </button>
          <button type="button" onClick={() => { setStep('form'); setCode(''); setError(''); setOtpVerified(false) }} className="text-center text-[11px] text-ink/70 underline">Change number</button>
        </form>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-1.5 rounded-[4px] border border-[#128C7E] px-3 py-2.5 text-sm font-medium text-[#0d6d61]">WhatsApp</a>
        <a href={`tel:+${WA_NUMBER}`} className="flex min-h-11 items-center justify-center gap-1.5 rounded-[4px] border border-celadon-deep px-3 py-2.5 text-sm font-medium text-celadon-deep">Call to order</a>
      </div>
    </section>
  )
}
