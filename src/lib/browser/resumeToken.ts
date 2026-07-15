import { createHmac, timingSafeEqual } from 'crypto'

const secret = () => process.env.JWT_SECRET || process.env.PAYLOAD_SECRET || 'dev-only-secret'

/**
 * Signed resume token (§13.5). Carries the cart + order-draft ids so /checkout/pay/[token] can
 * rehydrate from the token + DB in a cold browser — NEVER from cookies (they don't survive the hop).
 */
export type ResumePayload = { orderId?: number; mtxn?: string; cartToken?: string }

export function signResumeToken(p: ResumePayload, ttlMs = 15 * 60 * 1000): string {
  const payload = Buffer.from(JSON.stringify({ ...p, exp: Date.now() + ttlMs })).toString('base64url')
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyResumeToken(token: string | undefined | null): ResumePayload | null {
  if (!token) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = createHmac('sha256', secret()).update(payload).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as ResumePayload & { exp?: number }
    if (typeof data.exp !== 'number' || data.exp < Date.now()) return null
    return { orderId: data.orderId, mtxn: data.mtxn, cartToken: data.cartToken }
  } catch {
    return null
  }
}
