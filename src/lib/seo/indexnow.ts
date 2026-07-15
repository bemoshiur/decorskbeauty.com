import { absUrl, siteUrl } from './urls'

/**
 * IndexNow ping (§14.1) — notify Bing/Yandex/etc. the instant a page is published or repriced.
 * Creds-gated on INDEXNOW_KEY (no-op without it, so dev/test/CLI never fire a network call).
 * Best-effort: never throws into the caller's hook.
 */
export async function pingIndexNow(paths: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY
  if (!key || !paths.length) return
  const site = siteUrl()
  const host = new URL(site).host
  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ host, key, keyLocation: `${site}/indexnow-key.txt`, urlList: paths.map((p) => absUrl(p, site)) }),
    })
  } catch {
    // best-effort — search engines re-crawl anyway
  }
}
