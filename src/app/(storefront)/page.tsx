import Link from 'next/link'
import type { Metadata } from 'next'

import { listProductCards } from '@/lib/commerce'
import { ProductCard } from '@/components/ProductCard'
import { JsonLd } from '@/components/JsonLd'
import { TrustRow } from '@/components/store/TrustRow'
import { graph, localBusiness, itemList } from '@/lib/seo/jsonld'

export const revalidate = 300

export const metadata: Metadata = { alternates: { canonical: '/' } }

export default async function HomePage() {
  const cards = await listProductCards()
  const bestSellers = cards.slice(0, 8)

  return (
    <div>
      <JsonLd data={graph(localBusiness(), itemList(cards.map((c) => c.product)))} />

      {/* Hero — the authenticity thesis, conversion-first (§16.1) */}
      <section className="border-b border-grey/30 bg-gradient-to-b from-celadon/10 to-transparent">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:py-14 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-grey">Banani · Dhaka</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-celadon-deep sm:text-4xl lg:text-5xl">
              Korean skincare you can <span className="text-seal">verify</span> — not just trust.
            </h1>
            <p className="mt-4 max-w-xl leading-relaxed text-ink">
              Every unit ships from a tracked import lot with a batch code, manufacture and expiry dates. In a market full of &ldquo;100% authentic&rdquo; claims, we hand you the receipt.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="#shop" className="rounded-[4px] bg-celadon-deep px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-celadon">Shop now · Cash on Delivery</Link>
              <Link href="/verify" className="rounded-[4px] border border-celadon-deep px-6 py-3 text-sm font-medium text-celadon-deep transition-colors hover:bg-celadon/10">Verify a batch code</Link>
            </div>
          </div>
          <div className="rounded-[8px] border border-celadon/30 bg-paper p-5 font-mono text-xs text-ink shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.14em] text-grey">Authenticity slip · sample</p>
            <dl className="mt-3 space-y-1.5">
              <div className="flex justify-between"><dt className="text-grey">BATCH</dt><dd>SNP24K0917B</dd></div>
              <div className="flex justify-between"><dt className="text-grey">MFG</dt><dd>2024-09</dd></div>
              <div className="flex justify-between"><dt className="text-grey">EXP</dt><dd>2027-09</dd></div>
              <div className="flex justify-between"><dt className="text-grey">IMPORT LOT</dt><dd>KR-DKB-118</dd></div>
            </dl>
            <p className="mt-3 border-t border-grey/20 pt-2 text-[11px] text-celadon-deep">Printed on every product page — scan &amp; verify before you buy.</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <TrustRow className="my-6" />

        {/* Best sellers */}
        {bestSellers.length > 0 && (
          <section className="py-6">
            <h2 className="mb-4 text-lg font-semibold text-ink">Best sellers</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {bestSellers.map((c) => <ProductCard key={c.product.id} card={c} />)}
            </div>
          </section>
        )}

        {/* Why buy from us — the brand argument */}
        <section className="my-6 rounded-[8px] border border-grey/25 bg-white/50 p-6">
          <h2 className="text-lg font-semibold text-ink">Why buy from Decor&apos;s K-Beauty</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { h: 'Proof, not promises', p: 'Batch code, MFG & EXP printed on every product page. Verify the exact lot we ship before you order.' },
              { h: 'Tracked import lots', p: 'Sourced and imported in documented lots — no grey-market repacks, no expiry surprises.' },
              { h: 'Cash on Delivery', p: 'Pay when it arrives. Fast 2–3 day delivery across Dhaka, nationwide courier beyond.' },
            ].map((x) => (
              <div key={x.h}>
                <h3 className="text-sm font-semibold text-celadon-deep">{x.h}</h3>
                <p className="mt-1 text-sm leading-relaxed text-grey">{x.p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Shop all */}
        <section id="shop" className="scroll-mt-20 py-6">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-ink">Shop all</h2>
            <span className="font-mono text-xs text-grey">{cards.length} product{cards.length === 1 ? '' : 's'}</span>
          </div>
          {cards.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {cards.map((c) => <ProductCard key={c.product.id} card={c} />)}
            </div>
          ) : (
            <p className="py-12 text-center text-grey">The catalog is being stocked. Check back shortly.</p>
          )}
        </section>
      </div>
    </div>
  )
}
