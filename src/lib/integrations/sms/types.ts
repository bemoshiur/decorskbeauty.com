export type SmsResult = {
  ok: boolean
  provider: string
  id?: string
  error?: string
  segments?: number
}

/** Provider-agnostic SMS interface (§17.3). Gennet is the default; Alpha is the drop-in fallback. */
export interface SmsProvider {
  name: string
  send(to: string, body: string, opts?: { unicode?: boolean }): Promise<SmsResult>
  balance?(): Promise<number>
}

/** BD mobile → E.164 without '+': 01712113032 / +8801712113032 / 8801712113032 → 8801712113032. */
export function normalizeMsisdn(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.startsWith('880')) return digits
  if (digits.startsWith('0')) return `880${digits.slice(1)}`
  if (digits.length === 10) return `880${digits}`
  return digits
}

/** Segment count. English is GSM-7 (160/153); Unicode is 70/67. English-only build ⇒ GSM by default. */
export function segmentCount(body: string, unicode = false): number {
  const len = body.length
  if (unicode) return len <= 70 ? 1 : Math.ceil(len / 67)
  return len <= 160 ? 1 : Math.ceil(len / 153)
}
