/**
 * Send events to the Meta Conversions API (§13.3). Endpoint pins META_GRAPH_VERSION.
 * test_event_code is dev-only and NEVER sent in production (#22 / acceptance #22).
 */
export async function sendCapiEvents(events: object[]): Promise<{ ok: boolean; raw?: unknown; error?: string }> {
  const version = process.env.META_GRAPH_VERSION
  const dataset = process.env.META_DATASET_ID
  const token = process.env.META_CAPI_ACCESS_TOKEN
  if (!version || !dataset || !token) return { ok: false, error: 'Meta CAPI not configured' }

  const body: { data: object[]; test_event_code?: string } = { data: events }
  if (process.env.META_TEST_EVENT_CODE && process.env.NODE_ENV !== 'production') {
    body.test_event_code = process.env.META_TEST_EVENT_CODE
  }

  const res = await fetch(`https://graph.facebook.com/${version}/${dataset}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, access_token: token }),
  })
  const raw = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, raw, error: `CAPI HTTP ${res.status}` }
  return { ok: true, raw }
}
