import type { SmsProvider, SmsResult } from '../types'
import { normalizeMsisdn } from '../types'

/** Alpha SMS (sms.net.bd) — the drop-in fallback (§17.3). */
export function alphaProvider(cfg: { apiKey: string }): SmsProvider {
  return {
    name: 'alpha',
    async send(to, body): Promise<SmsResult> {
      try {
        const params = new URLSearchParams({ api_key: cfg.apiKey, msg: body, to: normalizeMsisdn(to) })
        const res = await fetch('https://api.sms.net.bd/sendsms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params,
        })
        const json = (await res.json().catch(() => ({}))) as { error?: number; msg?: string; data?: { request_id?: string } }
        const ok = json.error === 0
        return { ok, provider: 'alpha', id: json.data?.request_id, error: ok ? undefined : json.msg }
      } catch (err) {
        return { ok: false, provider: 'alpha', error: err instanceof Error ? err.message : 'send failed' }
      }
    },
  }
}
