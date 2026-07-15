import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { safeEqual } from '@/lib/auth/timingSafe'
import { cancelStaleOrders } from '@/lib/commerce/stock'
import { sendAlert } from '@/lib/alerts'

export const maxDuration = 60

/** Acceptance #11: an abandoned pending order releases its reservations within 60 minutes. */
const STALE_MINUTES = 60

/** Auth: CRON_SECRET (Bearer, as Vercel sends). Core logic lives in cancelStaleOrders (tested). */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const provided = req.headers.get('authorization')?.replace(/^Bearer /, '')
  if (!secret || !safeEqual(provided, secret)) return NextResponse.json({ ok: false }, { status: 401 })

  const payload = await getPayload({ config })
  const cutoffIso = new Date(Date.now() - STALE_MINUTES * 60_000).toISOString()
  const { scanned, released } = await cancelStaleOrders(payload, cutoffIso)

  if (scanned) await sendAlert('Abandoned orders cancelled', `${scanned} pending orders older than ${STALE_MINUTES}m were cancelled; ${released} had reservations released.`)
  return NextResponse.json({ ok: true, scanned, released })
}
