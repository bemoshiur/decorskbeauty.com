import type { Brand, Media, Product, StockLot, Variant } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { effectivePrice } from '@/lib/commerce/products'

/**
 * Catalog feed items (§13.2). `id` is byte-identical to `variants.sku` — the identity spine that
 * must match Pixel content_ids and CAPI contents[].id (#1, acceptance #19). meta.bn.xml is dropped
 * (English-only). Google + Meta both consume RSS 2.0 + the g: namespace.
 */
export type FeedItem = {
  id: string // === variants.sku
  itemGroupId: string
  title: string
  description: string
  availability: 'in stock' | 'out of stock' | 'preorder'
  price: string // "1250.00 BDT"
  salePrice?: string
  link: string
  imageLink?: string
  brand?: string
  inventory: number
  customLabel0?: string
  customLabel1?: string
  customLabel2?: string
  customLabel3?: string
  customLabel4?: string
}

const relId = (rel: unknown): number | null => (rel == null ? null : typeof rel === 'object' ? ((rel as { id?: number }).id ?? null) : (rel as number))
const bdt = (n: number) => `${n.toFixed(2)} BDT`

const marginBand = (price: number, landed: number | null): string => {
  if (landed == null || price <= 0) return 'unknown'
  const m = (price - landed) / price
  return m >= 0.5 ? 'high' : m >= 0.3 ? 'mid' : 'low'
}

export async function buildFeedItems(siteUrl: string): Promise<FeedItem[]> {
  const payload = await getPayloadClient()
  const { docs: products } = await payload.find({ collection: 'products', where: { _status: { equals: 'published' } }, depth: 1, limit: 2000 })
  const productById = new Map(products.map((p) => [p.id, p as Product]))
  const ids = products.map((p) => p.id)
  if (!ids.length) return []

  const { docs: variants } = await payload.find({ collection: 'variants', where: { product: { in: ids }, active: { equals: true } }, depth: 0, limit: 5000, overrideAccess: true })
  const { docs: lots } = await payload.find({ collection: 'stockLots', where: { variant: { in: variants.map((v) => v.id) } }, depth: 0, limit: 10000, overrideAccess: true })

  const minLandedByVariant = new Map<number, number>()
  for (const l of lots as StockLot[]) {
    const vId = relId(l.variant)
    if (vId == null || l.landedCostPerUnit == null) continue
    const cur = minLandedByVariant.get(vId)
    if (cur == null || l.landedCostPerUnit < cur) minLandedByVariant.set(vId, l.landedCostPerUnit)
  }

  const items: FeedItem[] = []
  for (const v of variants as Variant[]) {
    const p = productById.get(relId(v.product) ?? -1)
    if (!p?.slug) continue
    const brand = p.brand && typeof p.brand === 'object' ? (p.brand as Brand) : null
    const firstImage = p.images?.[0]?.image
    const media = firstImage && typeof firstImage === 'object' ? (firstImage as Media) : null
    const imageUrl = media?.sizes?.card?.url || media?.url
    const price = v.mrp ?? 0
    const sale = v.salePrice ?? null
    const isPre = p.fulfilmentMode === 'preOrder'
    const qty = v.availableQty ?? 0

    items.push({
      id: v.sku, // #1 — identity spine
      itemGroupId: p.slug,
      title: p.title,
      description: p.shortDescription ?? p.title,
      availability: isPre ? 'preorder' : qty > 0 ? 'in stock' : 'out of stock',
      price: bdt(price),
      salePrice: sale != null && sale < price ? bdt(sale) : undefined,
      link: `${siteUrl}/products/${p.slug}`,
      imageLink: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${siteUrl}${imageUrl}`) : undefined,
      brand: brand?.name,
      inventory: qty,
      customLabel0: p.skinTypes?.[0] ?? undefined,
      customLabel1: p.concerns?.[0] ?? undefined,
      customLabel2: isPre ? 'preOrder' : 'readyStock',
      customLabel3: p.routineStep != null ? String(p.routineStep) : undefined,
      customLabel4: marginBand(effectivePrice(v), minLandedByVariant.get(v.id) ?? null),
    })
  }
  return items
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

export function itemsToRss(items: FeedItem[], opts: { title: string; link: string }): string {
  const g = (tag: string, val?: string) => (val == null || val === '' ? '' : `<g:${tag}>${esc(val)}</g:${tag}>`)
  const entries = items
    .map(
      (i) => `<item>
<g:id>${esc(i.id)}</g:id>
${g('item_group_id', i.itemGroupId)}
<title>${esc(i.title)}</title>
<description>${esc(i.description)}</description>
<link>${esc(i.link)}</link>
${g('image_link', i.imageLink)}
${g('availability', i.availability)}
<g:condition>new</g:condition>
${g('price', i.price)}
${g('sale_price', i.salePrice)}
${g('brand', i.brand)}
<g:inventory>${i.inventory}</g:inventory>
${g('custom_label_0', i.customLabel0)}
${g('custom_label_1', i.customLabel1)}
${g('custom_label_2', i.customLabel2)}
${g('custom_label_3', i.customLabel3)}
${g('custom_label_4', i.customLabel4)}
</item>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${esc(opts.title)}</title>
<link>${esc(opts.link)}</link>
<description>Decor's K-Beauty product feed</description>
${entries}
</channel>
</rss>`
}
