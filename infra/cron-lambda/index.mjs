// dkb-cron-invoker — a thin AWS Lambda that EventBridge Scheduler invokes on a schedule, which in turn
// calls one storefront /api/cron/* route with the shared CRON_SECRET.
//
// Why a Lambda instead of pointing Scheduler straight at the URL: an EventBridge API-Destination target
// caps the HTTP call at 5s, and the Amplify SSR request itself is bounded — the cron jobs (courier
// reconcile, CAPI drain, expiry scan) need longer. The Lambda decouples the trigger from that budget and
// gives us CloudWatch logs per run.
//
// Runtime: nodejs20.x (global fetch). Handler: index.handler.
// Env: APP_URL (deployed origin, no trailing slash), CRON_SECRET (Bearer secret the routes verify).
// Event: { "path": "/api/cron/<name>" }  — supplied per-schedule by the EventBridge target Input.

// Only these exact paths may be invoked. This is the security boundary: it stops a malformed/hostile
// `path` (e.g. "@evil.com/…", which `${base}${path}` would resolve to another host) from ever leaking
// the CRON_SECRET Bearer header off-origin. Keep in sync with src/app/api/cron/*.
const ALLOWED = new Set([
  '/api/cron/capi-drain',
  '/api/cron/courier-sync',
  '/api/cron/expiry-scan',
  '/api/cron/release-stale',
  '/api/cron/sku-parity',
])

export const handler = async (event) => {
  const path = event?.path
  const base = process.env.APP_URL
  const secret = process.env.CRON_SECRET
  if (!path || !base || !secret) throw new Error('missing path/APP_URL/CRON_SECRET')
  if (!ALLOWED.has(path)) throw new Error(`invalid cron path: ${path}`)

  // Belt-and-suspenders: resolve against the base and require the origin to be unchanged before we
  // ever attach the Bearer secret, so no URL-confusion trick can redirect the credential off-origin.
  const url = new URL(path, base)
  if (url.origin !== new URL(base).origin || !url.pathname.startsWith('/api/cron/')) {
    throw new Error(`refusing off-origin cron target: ${url.href}`)
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: { authorization: `Bearer ${secret}` },
  })
  const body = await res.text()
  console.log(`cron ${path} -> HTTP ${res.status} ${body.slice(0, 300)}`)
  if (!res.ok) throw new Error(`cron ${path} returned ${res.status}`)
  return { ok: true, path, status: res.status }
}
