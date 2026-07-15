import { buildPathaoOrder, type CourierOrderInput } from '../courier/payloads'

/**
 * Pathao Courier client (§9.1). Token is long-lived — cached in-process here; production should
 * persist it in Neon and refresh by cron (§9.1), not re-issue per cold start.
 */
const BASE = () => (process.env.PATHAO_BASE_URL || 'https://api-hermes.pathao.com').replace(/\/$/, '')

let tokenCache: { token: string; exp: number } | null = null

async function token(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.exp - 60_000) return tokenCache.token
  const res = await fetch(`${BASE()}/aladdin/api/v1/issue-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.PATHAO_CLIENT_ID,
      client_secret: process.env.PATHAO_CLIENT_SECRET,
      username: process.env.PATHAO_USERNAME,
      password: process.env.PATHAO_PASSWORD,
      grant_type: 'password',
    }),
  })
  const j = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number }
  if (!j.access_token) throw new Error('Pathao issue-token failed')
  tokenCache = { token: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 }
  return j.access_token
}

export type CourierCreateError = Error & { status?: number; raw?: unknown }

export async function pathaoCreateOrder(input: CourierOrderInput): Promise<{ consignmentId: string; raw: unknown }> {
  const t = await token()
  const res = await fetch(`${BASE()}/aladdin/api/v1/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body: JSON.stringify(buildPathaoOrder(input, process.env.PATHAO_STORE_ID!)),
  })
  const j = (await res.json().catch(() => ({}))) as { data?: { consignment_id?: string } }
  if (!res.ok || !j.data?.consignment_id) {
    const err: CourierCreateError = new Error(`Pathao create-order HTTP ${res.status}`)
    err.status = res.status
    err.raw = j
    throw err
  }
  return { consignmentId: j.data.consignment_id, raw: j }
}

/** Phone success-rate for the fraud check (§9.3). Shapes vary — parse defensively. */
export async function pathaoSuccessRate(phone: string): Promise<{ successRatio: number | null; raw: unknown }> {
  const t = await token()
  const res = await fetch(`${BASE()}/aladdin/api/v1/user/success`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body: JSON.stringify({ phone }),
  })
  const j = (await res.json().catch(() => ({}))) as {
    data?: { success_rate?: number; total_delivery?: number; successful_delivery?: number; customer?: { success_rate?: number } }
  }
  const d = j.data
  const pct = (n?: number) => (typeof n === 'number' ? (n > 1 ? n / 100 : n) : null)
  let ratio = pct(d?.success_rate) ?? pct(d?.customer?.success_rate)
  if (ratio == null && d?.total_delivery && d?.successful_delivery != null && d.total_delivery > 0) {
    ratio = d.successful_delivery / d.total_delivery
  }
  return { successRatio: ratio, raw: j }
}

export async function pathaoStatus(consignmentId: string): Promise<{ status: string; raw: unknown }> {
  const t = await token()
  const res = await fetch(`${BASE()}/aladdin/api/v1/orders/${encodeURIComponent(consignmentId)}/info`, {
    headers: { Authorization: `Bearer ${t}` },
  })
  const j = (await res.json().catch(() => ({}))) as { data?: { order_status?: string } }
  return { status: j.data?.order_status ?? 'unknown', raw: j }
}
