import { randomBytes } from 'crypto'

import type { SmsProvider, SmsResult } from '../types'
import { normalizeMsisdn } from '../types'

/**
 * GenNet Push SMS v3.1 (see the gennet-sms-api memory). csms_id must be unique per day.
 * Base URL comes from the merchant panel (GENNET_BASE_URL) — until then the factory uses console.
 */
export function gennetProvider(cfg: { baseUrl: string; apiToken: string; sid: string }): SmsProvider {
  const csmsId = () => `DKB${Date.now().toString(36)}${randomBytes(3).toString('hex')}`.slice(0, 20).toUpperCase()

  // Accept either the domain (https://isms.gennet.com.bd) or the full endpoint URL — derive the
  // origin so send-sms/balance/status all resolve, regardless of what's set in GENNET_BASE_URL.
  const endpoint = (path: string) => {
    let origin = cfg.baseUrl.replace(/\/+$/, '')
    try {
      origin = new URL(cfg.baseUrl).origin
    } catch {
      /* keep the trimmed string if it isn't a full URL */
    }
    return `${origin}/api/v3/${path}`
  }

  return {
    name: 'gennet',
    async send(to, body): Promise<SmsResult> {
      try {
        const res = await fetch(endpoint('send-sms'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_token: cfg.apiToken,
            sid: cfg.sid,
            msisdn: normalizeMsisdn(to),
            sms: body,
            csms_id: csmsId(),
          }),
        })
        const json = (await res.json().catch(() => ({}))) as {
          status?: string
          status_code?: number
          error_message?: string
          smsinfo?: { reference_id?: string }[]
        }
        const ok = json.status === 'SUCCESS' || json.status_code === 200
        return { ok, provider: 'gennet', id: json.smsinfo?.[0]?.reference_id, error: ok ? undefined : json.error_message }
      } catch (err) {
        return { ok: false, provider: 'gennet', error: err instanceof Error ? err.message : 'send failed' }
      }
    },
  }
}
