import { randomBytes } from 'crypto'

import type { SmsProvider, SmsResult } from '../types'
import { normalizeMsisdn } from '../types'

/**
 * GenNet Push SMS v3.1 (see the gennet-sms-api memory). csms_id must be unique per day.
 * Base URL comes from the merchant panel (GENNET_BASE_URL) — until then the factory uses console.
 */
export function gennetProvider(cfg: { baseUrl: string; apiToken: string; sid: string }): SmsProvider {
  const csmsId = () => `DKB${Date.now().toString(36)}${randomBytes(3).toString('hex')}`.slice(0, 20).toUpperCase()

  return {
    name: 'gennet',
    async send(to, body): Promise<SmsResult> {
      try {
        const res = await fetch(`${cfg.baseUrl.replace(/\/$/, '')}/api/v3/send-sms`, {
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
