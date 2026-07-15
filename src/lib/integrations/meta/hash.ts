import { createHash } from 'crypto'

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

/** SHA-256 of a normalized (trim + lowercase) PII field. Undefined stays undefined. */
export const hashField = (v?: string | null): string | undefined => (v ? sha256(v.trim().toLowerCase()) : undefined)

/** Phone → E.164 without '+' (8801XXXXXXXXX), then SHA-256 (§13.3). */
export const hashPhone = (v?: string | null): string | undefined => {
  if (!v) return undefined
  const d = v.replace(/\D/g, '')
  const e164 = d.startsWith('880') ? d : d.startsWith('0') ? `880${d.slice(1)}` : d.length === 10 ? `880${d}` : d
  return sha256(e164)
}

export type UserDataInput = {
  email?: string | null
  phone?: string | null
  firstName?: string | null
  lastName?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  country?: string | null
  externalId?: string | null
  // NOT hashed (§13.3):
  fbp?: string | null
  fbc?: string | null
  clientIp?: string | null
  userAgent?: string | null
}

/** Build Meta user_data. em/ph/fn/ln/ct/st/zp/country/external_id are hashed; fbp/fbc/ip/ua are NOT. */
export function buildUserData(u: UserDataInput): Record<string, string> {
  const out: Record<string, string | undefined> = {
    em: hashField(u.email),
    ph: hashPhone(u.phone),
    fn: hashField(u.firstName),
    ln: hashField(u.lastName),
    ct: hashField(u.city),
    st: hashField(u.state),
    zp: hashField(u.zip),
    country: hashField(u.country),
    external_id: hashField(u.externalId),
    fbp: u.fbp ?? undefined,
    fbc: u.fbc ?? undefined,
    client_ip_address: u.clientIp ?? undefined,
    client_user_agent: u.userAgent ?? undefined,
  }
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v != null)) as Record<string, string>
}
