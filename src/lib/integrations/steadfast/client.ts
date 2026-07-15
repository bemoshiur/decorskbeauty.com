import { buildSteadfastOrder, type CourierOrderInput } from '../courier/payloads'

/** Steadfast client (§9.2) — the fallback courier. Headers: Api-Key / Secret-Key. */
const BASE = () => (process.env.STEADFAST_BASE_URL || 'https://portal.packzy.com/api/v1').replace(/\/$/, '')
const headers = () => ({
  'Content-Type': 'application/json',
  'Api-Key': process.env.STEADFAST_API_KEY ?? '',
  'Secret-Key': process.env.STEADFAST_SECRET_KEY ?? '',
})

export async function steadfastCreateOrder(input: CourierOrderInput): Promise<{ consignmentId: string; raw: unknown }> {
  const res = await fetch(`${BASE()}/create_order`, { method: 'POST', headers: headers(), body: JSON.stringify(buildSteadfastOrder(input)) })
  const j = (await res.json().catch(() => ({}))) as { consignment?: { consignment_id?: number | string; tracking_code?: string } }
  if (!res.ok || !j.consignment?.consignment_id) throw new Error(`Steadfast create_order HTTP ${res.status}`)
  return { consignmentId: String(j.consignment.consignment_id), raw: j }
}

export async function steadfastStatus(consignmentId: string): Promise<{ status: string; raw: unknown }> {
  const res = await fetch(`${BASE()}/status_by_cid/${encodeURIComponent(consignmentId)}`, { headers: headers() })
  const j = (await res.json().catch(() => ({}))) as { delivery_status?: string }
  return { status: j.delivery_status ?? 'unknown', raw: j }
}
