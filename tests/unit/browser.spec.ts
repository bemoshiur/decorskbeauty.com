import { describe, it, expect } from 'vitest'

import { isInAppBrowser, androidChromeIntent, iosSafariUrl } from '@/lib/browser/inApp'
import { signResumeToken, verifyResumeToken } from '@/lib/browser/resumeToken'

describe('in-app browser detection (§13.5)', () => {
  it('detects Facebook / Instagram webviews', () => {
    expect(isInAppBrowser('Mozilla/5.0 ... [FBAN/FBIOS;FBAV/450.0]')).toBe(true)
    expect(isInAppBrowser('Mozilla/5.0 ... FB_IAB/FB4A;FBAV/450')).toBe(true)
    expect(isInAppBrowser('Mozilla/5.0 ... Instagram 300.0')).toBe(true)
  })
  it('passes normal browsers', () => {
    expect(isInAppBrowser('Mozilla/5.0 (Linux; Android 13) Chrome/120')).toBe(false)
    expect(isInAppBrowser(null)).toBe(false)
  })
  it('builds escape URLs', () => {
    expect(androidChromeIntent('https://decorskbeauty.com/checkout/pay/abc')).toBe(
      'intent://decorskbeauty.com/checkout/pay/abc#Intent;scheme=https;package=com.android.chrome;end',
    )
    expect(iosSafariUrl('https://decorskbeauty.com/checkout/pay/abc')).toBe('x-safari-https://decorskbeauty.com/checkout/pay/abc')
  })
})

describe('resume token (§13.5)', () => {
  it('round-trips the order draft', () => {
    const t = signResumeToken({ orderId: 42, mtxn: 'TXN-1-A', cartToken: 'c1' })
    expect(verifyResumeToken(t)).toEqual({ orderId: 42, mtxn: 'TXN-1-A', cartToken: 'c1' })
  })
  it('rejects tampering', () => {
    const t = signResumeToken({ orderId: 42 })
    expect(verifyResumeToken(t.slice(0, -3) + 'xxx')).toBeNull()
    expect(verifyResumeToken('garbage')).toBeNull()
    expect(verifyResumeToken(null)).toBeNull()
  })
  it('rejects expired tokens', () => {
    const t = signResumeToken({ orderId: 1 }, -1000)
    expect(verifyResumeToken(t)).toBeNull()
  })
})
