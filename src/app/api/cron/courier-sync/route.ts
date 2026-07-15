import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { applyCourierStatus } from '@/lib/commerce/courierWebhook'
import { safeEqual } from '@/lib/auth/timingSafe'

export const maxDuration = 60

/**
 * 30-min reconciling cron (§9.4). BD courier webhooks get dropped — poll any order stuck in
 * handedToCourier / inTransit and apply the real status. Auth: CRON_SECRET (Bearer header, as Vercel sends).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const provided = req.headers.get('authorization')?.replace(/^Bearer /, '')
  if (!secret || !safeEqual(provided, secret)) return NextResponse.json({ ok: false }, { status: 401 })

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'orders',
    where: { fulfilmentStatus: { in: ['handedToCourier', 'inTransit'] } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })

  let synced = 0
  for (const order of docs) {
    const provider = order.courier?.provider
    const cid = order.courier?.consignmentId
    if (!provider || !cid || !order.orderNumber) continue
    try {
      const status =
        provider === 'pathao'
          ? (await (await import('@/lib/integrations/pathao/client')).pathaoStatus(cid)).status
          : (await (await import('@/lib/integrations/steadfast/client')).steadfastStatus(cid)).status
      await applyCourierStatus(payload, order.orderNumber, status, provider)
      synced++
    } catch {
      // courier API hiccup — try again next tick
    }
  }
  return NextResponse.json({ ok: true, checked: docs.length, synced })
}
