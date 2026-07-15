import type { MetadataRoute } from 'next'

import { siteUrl } from '@/lib/seo/urls'

/**
 * robots.txt (§14.1). AI crawlers are an acquisition channel now — let GPTBot / ClaudeBot /
 * PerplexityBot / Google-Extended in. Keep private + non-content paths out for everyone.
 */
const DISALLOW = ['/admin', '/api', '/checkout', '/account', '/cart']
const AI_BOTS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'OAI-SearchBot', 'anthropic-ai']

export default function robots(): MetadataRoute.Robots {
  const site = siteUrl()
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: '/', disallow: DISALLOW })),
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  }
}
