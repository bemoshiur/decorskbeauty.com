'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/** Phone + OTP sign-in (§17.1 — no passwords). Reuses /api/otp/*; on verify the dkb_phone cookie is set. */
export function LoginClient({ next = '/account' }: { next?: string }) {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const field = 'w-full rounded-[4px] border border-grey/40 bg-white px-3 py-3 text-sm text-ink outline-none focus:border-celadon-deep'

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!/^01\d{9}$/.test(phone.replace(/\s|-/g, ''))) return setError('Enter a valid 11-digit mobile number.')
    setBusy(true)
    try {
      const r = await fetch('/api/otp/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone }) })
      const j = await r.json()
      if (!j.ok) setError(j.error || 'Could not send the code.')
      else setStep('otp')
    } catch { setError('Network error. Please try again.') }
    setBusy(false)
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const r = await fetch('/api/otp/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone, code }) })
      const j = await r.json()
      if (!j.ok) { setError(j.error || 'Incorrect code.'); setBusy(false); return }
      router.push(next)
      router.refresh()
    } catch { setError('Network error. Please try again.'); setBusy(false) }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <div className="rounded-[8px] border border-grey/25 bg-white/60 p-6">
        <h1 className="text-xl font-semibold text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-grey">No account needed — we text you a code.</p>

        {step === 'phone' ? (
          <form onSubmit={sendCode} className="mt-5 flex flex-col gap-3">
            <label className="text-xs font-medium text-ink" htmlFor="ph">Mobile number</label>
            <input id="ph" className={field} placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" autoComplete="tel" autoFocus />
            {error && <p className="text-xs text-seal" role="alert">{error}</p>}
            <button type="submit" disabled={busy} className="rounded-[4px] bg-celadon-deep px-5 py-3 text-sm font-semibold text-paper disabled:opacity-60">{busy ? 'Sending…' : 'Send code'}</button>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-5 flex flex-col gap-3">
            <p className="text-sm text-grey">Enter the 6-digit code sent to {phone}.</p>
            <input className={`${field} text-center font-mono text-lg tracking-[0.4em]`} placeholder="______" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoFocus maxLength={6} aria-label="6-digit code" />
            {error && <p className="text-xs text-seal" role="alert">{error}</p>}
            <button type="submit" disabled={busy || code.length < 6} className="rounded-[4px] bg-celadon-deep px-5 py-3 text-sm font-semibold text-paper disabled:opacity-60">{busy ? 'Verifying…' : 'Verify & continue'}</button>
            <button type="button" onClick={() => { setStep('phone'); setCode(''); setError('') }} className="text-center text-[11px] text-grey underline">Change number</button>
          </form>
        )}
      </div>
    </div>
  )
}
