import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { applyCourierStatus } from '@/lib/commerce/courierWebhook'
import { safeEqual } from '@/lib/auth/timingSafe'

/** Pathao status webhook (§9.4). Dropped in BD — the reconciling cron is the safety net. */
export async function POST(req: NextRequest) {
  // Require the shared secret (constant-time) — an unauthenticated webhook could forge delivered/returned.
  const secret = process.env.PATHAO_WEBHOOK_SECRET
  const provided = req.headers.get('x-pathao-signature') ?? req.headers.get('authorization')?.replace(/^Bearer /, '')
  if (!secret || !safeEqual(provided, secret)) return NextResponse.json({ ok: false }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { merchant_order_id?: string; order_status?: string; event?: string }
  const orderNumber = body.merchant_order_id
  const status = body.order_status ?? body.event
  if (!orderNumber || !status) return NextResponse.json({ ok: false, error: 'missing fields' }, { status: 400 })

  const payload = await getPayload({ config })
  const r = await applyCourierStatus(payload, String(orderNumber), String(status), 'pathao')
  return NextResponse.json(r, { status: r.ok ? 202 : 404 })
}
