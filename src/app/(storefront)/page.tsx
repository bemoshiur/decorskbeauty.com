import { listProductCards } from '@/lib/commerce'
import { ProductCard } from '@/components/ProductCard'

export const revalidate = 300

export default async function HomePage() {
  const cards = await listProductCards()

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero — the thesis (§16.1): prove it's real, then sell. */}
      <section className="border-b border-grey/30 py-12 sm:py-16">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-grey">Banani · Dhaka</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-celadon-deep sm:text-4xl">
          Korean skincare you can verify — not just trust.
        </h1>
        <p className="mt-4 max-w-xl leading-relaxed text-ink">
          Every unit ships from a tracked import lot with a batch code, manufacture and expiry dates.
          In a market full of &ldquo;100% authentic&rdquo; claims, we give you the receipt.
        </p>
      </section>

      <section className="py-10">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-ink">Shop all</h2>
          <span className="font-mono text-xs text-grey">
            {cards.length} product{cards.length === 1 ? '' : 's'}
          </span>
        </div>

        {cards.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {cards.map((c) => (
              <ProductCard key={c.product.id} card={c} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-grey">The catalog is being stocked. Check back shortly.</p>
        )}
      </section>
    </div>
  )
}
