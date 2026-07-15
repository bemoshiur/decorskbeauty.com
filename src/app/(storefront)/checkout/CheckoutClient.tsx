'use client'

import { useState } from 'react'

import { computeCheckoutTerms, ZONE_LABEL, type Zone } from '@/lib/commerce/checkout'
import { Price } from '@/components/Price'
import type { CartViewItem } from '@/lib/commerce/cart'

const ZONES: Zone[] = ['dhakaCity', 'dhakaSub', 'outside']

export function CheckoutClient({ items, subtotal }: { items: CartViewItem[]; subtotal: number }) {
  const [zone, setZone] = useState<Zone>('dhakaCity')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [verified, setVerified] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const terms = computeCheckoutTerms(
    { lines: items.map((i) => ({ unitPrice: i.unitPrice, qty: i.qty, isPreOrder: i.isPreOrder })) },
    zone,
  )

  const call = async (url: string, body: object) => {
    setBusy(true)
    setMsg(null)
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      return (await r.json()) as { ok: boolean; error?: string }
    } finally {
      setBusy(false)
    }
  }

  const sendCode = async () => {
    const j = await call('/api/otp/request', { phone })
    if (j.ok) {
      setCodeSent(true)
      setMsg('We sent you a code (dev: check the server log).')
    } else setMsg(j.error ?? 'Could not send the code.')
  }
  const verify = async () => {
    const j = await call('/api/otp/verify', { phone, code })
    if (j.ok) {
      setVerified(true)
      setMsg('Phone verified.')
    } else setMsg(j.error ?? 'Incorrect code.')
  }

  const field = 'w-full rounded-[4px] border border-grey/50 bg-white/60 px-3 py-2 text-sm text-ink outline-none focus:border-celadon'

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-celadon-deep">Checkout</h1>

      {/* Cart */}
      <section className="mt-6 border border-grey/30">
        {items.map((i) => (
          <div key={i.variantId} className="flex items-center justify-between gap-3 border-b border-grey/20 px-4 py-3 last:border-b-0">
            <div>
              <p className="text-sm text-ink">{i.title}</p>
              <p className="font-mono text-xs text-grey">
                {i.option ? `${i.option} · ` : ''}Qty {i.qty}
                {i.isPreOrder ? ' · pre-order' : ''}
              </p>
            </div>
            <Price amount={i.lineTotal} className="text-sm text-ink" />
          </div>
        ))}
      </section>

      {/* Zone → live terms (§7) */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-ink">Delivery area</h2>
        <div className="flex flex-wrap gap-2">
          {ZONES.map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setZone(z)}
              className={`rounded-[4px] border px-3 py-1.5 text-sm ${
                zone === z ? 'border-celadon-deep bg-celadon/10 text-celadon-deep' : 'border-grey/40 text-ink'
              }`}
            >
              {ZONE_LABEL[z]}
            </button>
          ))}
        </div>

        <dl className="mt-4 border border-grey/30 p-4 font-mono text-sm">
          <div className="flex justify-between py-0.5">
            <dt className="text-grey">Subtotal</dt>
            <dd><Price amount={subtotal} /></dd>
          </div>
          <div className="flex justify-between py-0.5">
            <dt className="text-grey">Delivery</dt>
            <dd>{terms.deliveryCharge === 0 ? 'Free' : <Price amount={terms.deliveryCharge} />}</dd>
          </div>
          <div className="flex justify-between border-t border-grey/30 py-1 mt-1 text-ink">
            <dt>Total</dt>
            <dd><Price amount={terms.grandTotal} /></dd>
          </div>
          {terms.advanceRequired > 0 && (
            <div className="flex justify-between py-0.5 text-celadon-deep">
              <dt>Advance now (online)</dt>
              <dd><Price amount={terms.advanceRequired} /></dd>
            </div>
          )}
          <div className="flex justify-between py-0.5">
            <dt className="text-grey">{terms.codAllowed ? 'Cash on delivery' : 'Payable online'}</dt>
            <dd><Price amount={terms.codAllowed ? terms.codAmount : terms.grandTotal} /></dd>
          </div>
        </dl>
        <ul className="mt-2 space-y-0.5 text-xs text-grey">
          {terms.reason.map((r, i) => (
            <li key={i}>· {r}</li>
          ))}
        </ul>
      </section>

      {/* Phone + OTP (guest — no account required, §17.1) */}
      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-ink">Your phone</h2>
        <div className="flex flex-wrap gap-2">
          <input className={field + ' flex-1'} inputMode="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={verified} />
          <button type="button" onClick={sendCode} disabled={busy || verified || phone.length < 11} className="rounded-[4px] border border-celadon-deep px-4 py-2 text-sm text-celadon-deep disabled:opacity-40">
            {codeSent ? 'Resend' : 'Send code'}
          </button>
        </div>
        {codeSent && !verified && (
          <div className="mt-2 flex flex-wrap gap-2">
            <input className={field + ' flex-1'} inputMode="numeric" placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} />
            <button type="button" onClick={verify} disabled={busy || code.length < 6} className="rounded-[4px] bg-celadon-deep px-4 py-2 text-sm text-paper disabled:opacity-40">
              Verify
            </button>
          </div>
        )}
        {verified && <p className="mt-2 font-mono text-xs text-celadon-deep">✓ Phone verified</p>}
        {msg && <p className="mt-2 text-xs text-grey">{msg}</p>}
      </section>

      {/* Address (guest) */}
      <section className="mt-6 grid gap-2">
        <h2 className="text-sm font-semibold text-ink">Delivery address</h2>
        <input className={field} placeholder="Full name" />
        <input className={field} placeholder="Street address, area, landmark" />
      </section>

      {/* Place order — order creation + EPS payment land in Phase 4 */}
      <button
        type="button"
        disabled
        title="Payment (EPS + COD) is wired in Phase 4"
        className="mt-6 w-full rounded-[4px] bg-celadon-deep px-5 py-3 text-sm text-paper disabled:opacity-50"
      >
        {verified ? 'Place order (payment arrives in Phase 4)' : 'Verify your phone to continue'}
      </button>
    </div>
  )
}
