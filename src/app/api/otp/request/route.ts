import { randomInt } from 'crypto'

import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { getSmsProvider, normalizeMsisdn } from '@/lib/integrations/sms'
import { hashOtp } from '@/lib/auth/otpToken'

const RATE_PER_PHONE = 3 // per hour
const RATE_PER_IP = 10 // per hour

export async function POST(req: NextRequest) {
  const { phone } = (await req.json().catch(() => ({}))) as { phone?: string }
  const msisdn = normalizeMsisdn(phone ?? '')
  if (!/^8801\d{9}$/.test(msisdn)) {
    return NextResponse.json({ ok: false, error: 'Enter a valid Bangladeshi mobile number.' }, { status: 400 })
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  const payload = await getPayload({ config })
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString()

  const byPhone = await payload.count({
    collection: 'otpChallenges',
    where: { phone: { equals: msisdn }, createdAt: { greater_than: hourAgo } },
    overrideAccess: true,
  })
  if (byPhone.totalDocs >= RATE_PER_PHONE) {
    return NextResponse.json({ ok: false, error: 'Too many codes requested. Try again in an hour.' }, { status: 429 })
  }
  const byIp = await payload.count({
    collection: 'otpChallenges',
    where: { ip: { equals: ip }, createdAt: { greater_than: hourAgo } },
    overrideAccess: true,
  })
  if (byIp.totalDocs >= RATE_PER_IP) {
    return NextResponse.json({ ok: false, error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  // CSPRNG — OTP codes must be unpredictable and uniformly distributed.
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  await payload.create({
    collection: 'otpChallenges',
    overrideAccess: true,
    data: {
      phone: msisdn,
      codeHash: hashOtp(msisdn, code),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      attempts: 0,
      ip,
      consumed: false,
    },
  })

  const result = await getSmsProvider().send(
    msisdn,
    `Your Decor's K-Beauty verification code is ${code}. It expires in 5 minutes.`,
  )
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: 'Could not send the code. Please try again.' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
