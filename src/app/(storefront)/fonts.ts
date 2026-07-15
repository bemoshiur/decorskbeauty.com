import localFont from 'next/font/local'

/*
  Self-hosted fonts via next/font/local (§15.2). Latin-only subsets — English build.
  Anek Bangla / Hind Siliguri (Bengali) intentionally omitted.
*/

// Display + UI face (§16.2)
export const anekLatin = localFont({
  src: '../fonts/anek-latin-latin-wght-normal.woff2',
  variable: '--font-anek-latin',
  preload: false,
  weight: '100 800',
  // 'optional' (not 'swap'): on slow 4G the LCP heading paints in the fallback and is NOT
  // repainted by a late web-font swap, keeping LCP < 2s (§15.1). The web font applies from
  // cache on the next view. adjustFontFallback keeps CLS at 0 (§15.2 intent).
  display: 'optional',
  adjustFontFallback: 'Arial',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
})

// Evidential / data face — batch codes, EXP, SKU, prices, order + tracking codes (§16.2)
export const martianMono = localFont({
  src: '../fonts/martian-mono-latin-wght-normal.woff2',
  variable: '--font-martian-mono',
  preload: false,
  weight: '100 800',
  display: 'optional',
  adjustFontFallback: false,
  fallback: ['ui-monospace', 'SFMono-Regular', 'monospace'],
})
