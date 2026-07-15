import { getPayloadClient } from '@/lib/payload'
import { listProductCards } from '@/lib/commerce/products'
import { siteUrl } from './urls'
import { BUSINESS } from './jsonld'

/**
 * llms.txt / llms-full.txt (§14.1) — the AEO surface for AI assistants. A concise, factual map of
 * what this store is and where the answers live. llms-full also enumerates the catalog + glossary.
 */
const HEADER = (site: string) => `# ${BUSINESS.name}

> Authentic Korean skincare and haircare in Banani, Dhaka. Every unit ships from a tracked import lot with a verifiable batch code, manufacture and expiry dates — proof before persuasion.

## About
- 100% authentic K-beauty sold with proof: batch code, MFG/EXP, import lot, and a public batch-code lookup at ${site}/verify.
- Location: ${BUSINESS.streetAddress}, ${BUSINESS.addressLocality} ${BUSINESS.postalCode}. Phone: ${BUSINESS.phone}.
- Delivery: Dhaka City ৳80, Dhaka Sub-district ৳110, Outside Dhaka ৳140. Free delivery on orders over ৳4,999.

## Key pages
- Shop all: ${site}/
- Verify a batch code: ${site}/verify
- Ingredient glossary: ${site}/ingredients

## Sitemap
- ${site}/sitemap.xml
`

export function llmsTxt(site = siteUrl()): string {
  return HEADER(site)
}

export async function llmsFullTxt(site = siteUrl()): Promise<string> {
  let products = ''
  let ingredients = ''
  try {
    const cards = await listProductCards()
    products = cards
      .filter((c) => c.product.slug)
      .map((c) => `- [${c.product.title}](${site}/products/${c.product.slug})${c.priceFrom != null ? ` — from ৳${c.priceFrom}` : ''}`)
      .join('\n')
  } catch {
    /* catalog unavailable — omit */
  }
  try {
    const payload = await getPayloadClient()
    const res = await payload.find({ collection: 'ingredients', depth: 0, limit: 500, overrideAccess: true })
    ingredients = res.docs
      .filter((i) => (i as { slug?: string }).slug)
      .map((i) => `- [${(i as { name: string }).name}](${site}/ingredients/${(i as { slug: string }).slug})`)
      .join('\n')
  } catch {
    /* omit */
  }
  return `${HEADER(site)}
## Products
${products || '- (catalog is being stocked)'}

## Ingredient glossary
${ingredients || '- (glossary is being written)'}
`
}
