'use client'

import { useState } from 'react'

export function PayResumeClient({ token }: { token: string }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const pay = async () => {
    setBusy(true)
    setErr(null)
    try {
      const r = await fetch('/api/payments/eps/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const j = (await r.json()) as { ok: boolean; redirectUrl?: string; redirect?: string; error?: string }
      if (j.ok && (j.redirectUrl || j.redirect)) {
        window.location.href = (j.redirectUrl || j.redirect)!
        return
      }
      setErr(j.error ?? 'Could not start payment.')
    } catch {
      setErr('Network error. Please try again.')
    }
    setBusy(false)
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={pay}
        disabled={busy}
        className="w-full rounded-[4px] bg-celadon-deep px-5 py-3 text-sm text-paper hover:bg-celadon disabled:opacity-50"
      >
        {busy ? 'Starting…' : 'Pay now'}
      </button>
      {err && <p className="mt-2 text-sm text-seal">{err}</p>}
    </div>
  )
}
