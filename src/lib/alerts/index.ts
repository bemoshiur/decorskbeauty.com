/**
 * Owner alerts (§11.5) — low stock, near-expiry digest, failed courier push, CAPI queue depth, stuck
 * EPS, review backlog. Emails via Resend when configured, else logs. Best-effort: never throws into
 * the caller (a cron must finish its work even if the alert channel is down). Email is secondary in
 * BD (§17.5) — this is an operator convenience, not a source of truth.
 */
export async function sendAlert(subject: string, body: string): Promise<void> {
  const key = process.env.RESEND_API_KEY
  const to = process.env.ALERT_EMAIL
  const from = process.env.ALERT_FROM || 'alerts@decorskbeauty.com'
  if (!key || !to) {
    console.warn(`[alert] ${subject}\n${body}`)
    return
  }
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to, subject: `[Decor's K-Beauty] ${subject}`, text: body }),
    })
  } catch (err) {
    console.warn(`[alert] send failed: ${subject}`, err instanceof Error ? err.message : err)
  }
}
