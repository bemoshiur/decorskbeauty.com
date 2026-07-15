import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { normalizeMsisdn } from '@/lib/integrations/sms'
import { hashOtp, signPhoneToken } from '@/lib/auth/otpToken'

const MAX_ATTEMPTS = 3
const LOCK_MS = 15 * 60 * 1000

export async function POST(req: NextRequest) {
  const { phone, code } = (await req.json().catch(() => ({}))) as { phone?: string; code?: string }
  const msisdn = normalizeMsisdn(phone ?? '')
  if (!/^8801\d{9}$/.test(msisdn) || !code) {
    return NextResponse.json({ ok: false, error: 'Missing phone or code.' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'otpChallenges',
    where: { phone: { equals: msisdn }, consumed: { equals: false } },
    sort: '-createdAt',
    limit: 1,
    overrideAccess: true,
  })
  const ch = docs[0]
  if (!ch) return NextResponse.json({ ok: false, error: 'Request a code first.' }, { status: 400 })

  const now = Date.now()
  if (ch.lockedUntil && new Date(ch.lockedUntil).getTime() > now) {
    return NextResponse.json({ ok: false, error: 'Too many attempts. Try again later.' }, { status: 429 })
  }
  if (new Date(ch.expiresAt).getTime() < now) {
    return NextResponse.json({ ok: false, error: 'This code has expired. Request a new one.' }, { status: 400 })
  }

  if (hashOtp(msisdn, String(code)) === ch.codeHash) {
    await payload.update({ collection: 'otpChallenges', id: ch.id, data: { consumed: true }, overrideAccess: true })
    const res = NextResponse.json({ ok: true })
    res.cookies.set('dkb_phone', signPhoneToken(msisdn), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    })
    return res
  }

  const attempts = (ch.attempts ?? 0) + 1
  const data: Record<string, unknown> = { attempts }
  if (attempts >= MAX_ATTEMPTS) data.lockedUntil = new Date(now + LOCK_MS).toISOString()
  await payload.update({ collection: 'otpChallenges', id: ch.id, data, overrideAccess: true })

  return NextResponse.json(
    { ok: false, error: attempts >= MAX_ATTEMPTS ? 'Too many attempts. Locked for 15 minutes.' : 'Incorrect code.' },
    { status: 400 },
  )
}
