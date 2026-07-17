// One-off: render a branded 1200x630 social-share image to public/og.png (deterministic, no runtime
// font/next-og risk). Run: node scripts/gen-og.mjs
import sharp from 'sharp'
import { mkdirSync } from 'fs'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1E3D30"/>
      <stop offset="0.55" stop-color="#2F5D4A"/>
      <stop offset="1" stop-color="#3f7a61"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.82" cy="0.18" r="0.5">
      <stop offset="0" stop-color="#7FA893" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#7FA893" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.1" cy="0.95" r="0.5">
      <stop offset="0" stop-color="#F5C9A6" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#F5C9A6" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect width="1200" height="630" fill="url(#glow2)"/>
  <g transform="translate(90, 150)">
    <rect x="0" y="0" width="118" height="24" rx="12" fill="#7FA893" fill-opacity="0.25"/>
    <text x="16" y="17" font-family="Georgia, 'Times New Roman', serif" font-size="13" letter-spacing="2" fill="#DCE8E1">100% AUTHENTIC</text>
    <text x="0" y="120" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="86" fill="#F2F4F1">Decor&#8217;s K-Beauty</text>
    <text x="2" y="185" font-family="Helvetica, Arial, sans-serif" font-size="34" fill="#C9D8CF">Authentic Korean skincare &amp; haircare</text>
    <text x="2" y="235" font-family="Helvetica, Arial, sans-serif" font-size="34" fill="#C9D8CF">Cash on Delivery across Bangladesh</text>
    <g transform="translate(0, 300)">
      <rect x="0" y="0" width="200" height="52" rx="26" fill="#F2F4F1"/>
      <text x="34" y="33" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="20" fill="#1E3D30">Shop now</text>
      <rect x="220" y="0" width="184" height="52" rx="26" fill="none" stroke="#A9C6B6" stroke-width="2"/>
      <text x="250" y="33" font-family="Helvetica, Arial, sans-serif" font-size="19" fill="#DCE8E1">Verify a batch</text>
    </g>
  </g>
</svg>`

mkdirSync('public', { recursive: true })
await sharp(Buffer.from(svg)).png().toFile('public/og.png')
console.log('wrote public/og.png (1200x630)')
