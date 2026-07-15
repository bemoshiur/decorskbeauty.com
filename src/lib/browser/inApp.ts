/** Detect the Facebook / Instagram in-app webview (§13.5) — where the EPS redirect chain breaks. */
export function isInAppBrowser(ua: string | null | undefined): boolean {
  if (!ua) return false
  return /FBAN|FBAV|FB_IAB|FBIOS|Instagram/i.test(ua)
}

/** Android intent:// URL to escape the webview into Chrome (§13.5). */
export function androidChromeIntent(url: string): string {
  const https = url.replace(/^https?:\/\//, '')
  return `intent://${https}#Intent;scheme=https;package=com.android.chrome;end`
}

/** iOS scheme to open the URL in Safari (§13.5). */
export function iosSafariUrl(url: string): string {
  return `x-safari-${url}`
}
