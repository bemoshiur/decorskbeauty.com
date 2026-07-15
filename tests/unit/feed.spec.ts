import { describe, it, expect } from 'vitest'

import { itemsToRss, type FeedItem } from '@/lib/seo/feed'

const item: FeedItem = {
  id: 'CRX-921', // === variants.sku (#1)
  itemGroupId: 'advanced-snail-96-mucin-power-essence',
  title: 'Advanced Snail 96 Mucin Power Essence',
  description: 'Hydrates & repairs <with> "snail" & mucin',
  availability: 'in stock',
  price: '1680.00 BDT',
  link: 'https://decorskbeauty.com/products/advanced-snail-96-mucin-power-essence',
  imageLink: 'https://decorskbeauty.com/img.webp',
  brand: 'COSRX',
  inventory: 30,
  customLabel2: 'readyStock',
}

describe('feed RSS (§13.2, acceptance #19)', () => {
  const xml = itemsToRss([item], { title: 'feed', link: 'https://decorskbeauty.com' })

  it('feed id is the SKU, byte-identical', () => {
    expect(xml).toContain('<g:id>CRX-921</g:id>')
  })
  it('price is "N.NN BDT"', () => {
    expect(xml).toContain('<g:price>1680.00 BDT</g:price>')
  })
  it('is well-formed RSS 2.0 with the g namespace', () => {
    expect(xml).toContain('xmlns:g="http://base.google.com/ns/1.0"')
    expect(xml).toContain('<g:condition>new</g:condition>')
  })
  it('XML-escapes special characters in text', () => {
    expect(xml).toContain('&lt;with&gt; &quot;snail&quot; &amp; mucin')
  })
})
