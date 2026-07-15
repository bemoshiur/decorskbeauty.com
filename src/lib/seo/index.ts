// src/lib/seo — jsonld builders, sitemaps, canonical, llms.txt, IndexNow (§14).
export * from './urls'
export * from './jsonld'
export * from './shipping'
export { llmsTxt, llmsFullTxt } from './llms'
export { pingIndexNow } from './indexnow'
export { urlsetXml, sitemapIndexXml, fetchSlugs, collectionUrlset, SITEMAP_CHILDREN, STATIC_PATHS, type UrlEntry } from './sitemap'
