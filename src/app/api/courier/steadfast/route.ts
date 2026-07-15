import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { applyCourierStatus } from '@/lib/commerce/courierWebhook'

/** Steadfast status webhook (§9.4). Verifies the shared webhook token. */
export async function POST(req: NextRequest) {
  // Require the shared token — an unauthenticated status webhook could forge delivered/returned.
  const token = process.env.STEADFAST_WEBHOOK_TOKEN
  const provided = req.headers.get('authorization')?.replace(/^Bearer /, '') ?? req.nextUrl.searchParams.get('token')
  if (!token || provided !== token) return NextResponse.json({ ok: false }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { invoice?: string; status?: string; delivery_status?: string }
  const orderNumber = body.invoice
  const status = body.status ?? body.delivery_status
  if (!orderNumber || !status) return NextResponse.json({ ok: false, error: 'missing fields' }, { status: 400 })

  const payload = await getPayload({ config })
  const r = await applyCourierStatus(payload, String(orderNumber), String(status))
  return NextResponse.json(r, { status: r.ok ? 200 : 404 })
}
