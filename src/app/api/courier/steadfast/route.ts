import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { applyCourierStatus } from '@/lib/commerce/courierWebhook'
import { safeEqual } from '@/lib/auth/timingSafe'

/** Steadfast status webhook (§9.4). Verifies the shared token (Authorization header, constant-time). */
export async function POST(req: NextRequest) {
  const token = process.env.STEADFAST_WEBHOOK_TOKEN
  const provided = req.headers.get('authorization')?.replace(/^Bearer /, '')
  if (!token || !safeEqual(provided, token)) return NextResponse.json({ ok: false }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { invoice?: string; status?: string; delivery_status?: string }
  const orderNumber = body.invoice
  const status = body.status ?? body.delivery_status
  if (!orderNumber || !status) return NextResponse.json({ ok: false, error: 'missing fields' }, { status: 400 })

  const payload = await getPayload({ config })
  const r = await applyCourierStatus(payload, String(orderNumber), String(status), 'steadfast')
  return NextResponse.json(r, { status: r.ok ? 200 : 404 })
}
