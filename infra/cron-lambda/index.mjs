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
export const handler = async (event) => {
  const path = event?.path
  const base = process.env.APP_URL
  const secret = process.env.CRON_SECRET
  if (!path || !base || !secret) throw new Error('missing path/APP_URL/CRON_SECRET')

  const res = await fetch(`${base}${path}`, {
    method: 'GET',
    headers: { authorization: `Bearer ${secret}` },
  })
  const body = await res.text()
  console.log(`cron ${path} -> HTTP ${res.status} ${body.slice(0, 300)}`)
  if (!res.ok) throw new Error(`cron ${path} returned ${res.status}`)
  return { ok: true, path, status: res.status }
}
