// Type family (see docs/superpowers/plans/2026-07-17-premium-redesign.md):
//  - Fraunces   → --font-display : editorial variable serif for headlines / section titles (premium voice)
//  - Geist Sans → --font-sans    : clean grotesk for UI + body
//  - Geist Mono → --font-mono    : evidential voice for prices, SKU, batch codes, tracking
// Self-hosted via next/font (subset + preloaded at build → zero layout shift, no runtime fetch).
import { Fraunces } from 'next/font/google'

export { GeistSans } from 'geist/font/sans'
export { GeistMono } from 'geist/font/mono'

export const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  // Optical-size + a touch of softness for a warm, high-end editorial feel.
  axes: ['opsz', 'SOFT'],
})
