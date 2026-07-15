import { createHmac, timingSafeEqual } from 'crypto'

const secret = () => process.env.JWT_SECRET || process.env.PAYLOAD_SECRET || 'dev-only-secret'

/** Keyed hash of an OTP — never store the code itself (§17.1). */
export function hashOtp(phone: string, code: string): string {
  return createHmac('sha256', secret()).update(`${phone}:${code}`).digest('hex')
}

/** Compact signed phone-verification token (JWT-like) set as an HttpOnly cookie after OTP success. */
export function signPhoneToken(phone: string, ttlMs = 15 * 60 * 1000): string {
  const payload = Buffer.from(JSON.stringify({ phone, exp: Date.now() + ttlMs })).toString('base64url')
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyPhoneToken(token: string | undefined | null): { phone: string } | null {
  if (!token) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = createHmac('sha256', secret()).update(payload).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { phone?: unknown; exp?: unknown }
    if (typeof data.phone !== 'string' || typeof data.exp !== 'number' || data.exp < Date.now()) return null
    return { phone: data.phone }
  } catch {
    return null
  }
}
