import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { safeEqual } from '@/lib/auth/timingSafe'
import { sendCapiEvents } from '@/lib/integrations/meta/capi'

export const maxDuration = 60

/** Drain the CAPI queue (§13.3): send pending events, exponential backoff on failure, alert on depth > 50. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const provided = req.headers.get('authorization')?.replace(/^Bearer /, '')
  if (!secret || !safeEqual(provided, secret)) return NextResponse.json({ ok: false }, { status: 401 })

  const payload = await getPayload({ config })
  const now = Date.now()
  const { docs } = await payload.find({
    collection: 'capiQueue',
    where: { status: { equals: 'pending' }, nextAttemptAt: { less_than_equal: new Date(now).toISOString() } },
    limit: 100,
    overrideAccess: true,
  })

  let sent = 0
  let failed = 0
  for (const row of docs) {
    const r = await sendCapiEvents([row.payload as object])
    if (r.ok) {
      await payload.update({ collection: 'capiQueue', id: row.id, data: { status: 'sent' }, overrideAccess: true })
      sent++
    } else {
      const attempts = (row.attempts ?? 0) + 1
      const backoffSec = Math.min(3600, 2 ** attempts * 60) // exponential backoff
      await payload.update({
        collection: 'capiQueue',
        id: row.id,
        overrideAccess: true,
        data: { attempts, status: attempts >= 6 ? 'failed' : 'pending', nextAttemptAt: new Date(now + backoffSec * 1000).toISOString(), error: r.error },
      })
      failed++
    }
  }

  const depth = await payload.count({ collection: 'capiQueue', where: { status: { equals: 'pending' } } })
  return NextResponse.json({ ok: true, sent, failed, depth: depth.totalDocs, alert: depth.totalDocs > 50 })
}
