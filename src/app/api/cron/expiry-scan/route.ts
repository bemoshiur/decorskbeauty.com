import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { safeEqual } from '@/lib/auth/timingSafe'
import { runExpiryScan } from '@/lib/inventory/expiry'
import { sendAlert } from '@/lib/alerts'

export const maxDuration = 120

/** Daily near-expiry scan (§10.3). Auth: CRON_SECRET (Bearer). Core logic lives in runExpiryScan (tested). */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const provided = req.headers.get('authorization')?.replace(/^Bearer /, '')
  if (!secret || !safeEqual(provided, secret)) return NextResponse.json({ ok: false }, { status: 401 })

  const payload = await getPayload({ config })
  const r = await runExpiryScan(payload, Date.now())

  if (r.expired || r.shortFlagged) {
    await sendAlert('Near-expiry scan', `${r.expired} lots expired + written off (৳${r.writeOffValue}); ${r.shortFlagged} newly flagged short-expiry.`)
  }
  return NextResponse.json({ ok: true, ...r })
}
