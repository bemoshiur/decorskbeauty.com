import Link from 'next/link'
import type { Metadata } from 'next'

import type { Category } from '@/payload-types'
import { listProductCards } from '@/lib/commerce'
import { ProductGridItems } from '@/components/commerce/product-elements'

export const revalidate = 300
export const metadata: Metadata = { title: 'Search', alternates: { canonical: '/search' } }

const SORTS = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'price-asc', label: 'Price: Low to high' },
  { key: 'price-desc', label: 'Price: High to low' },
  { key: 'title', label: 'Alphabetical' },
]

const catList = (p: { categories?: unknown }): Category[] => ((p.categories ?? []) as unknown[]).filter((c): c is Category => typeof c === 'object' && c != null)

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string; collection?: string }> }) {
  const { q = '', sort = 'relevance', collection = '' } = await searchParams
  const all = await listProductCards()

  // Collections sidebar — derived from the catalog (name + slug), de-duped.
  const catMap = new Map<string, string>()
  for (const c of all) for (const cat of catList(c.product)) if (cat.slug) catMap.set(cat.slug, cat.name)
  const collections = [...catMap.entries()].sort((a, b) => a[1].localeCompare(b[1]))

  let results = all
  if (q.trim()) {
    const term = q.trim().toLowerCase()
    results = results.filter((c) => c.product.title.toLowerCase().includes(term))
  }
  if (collection) results = results.filter((c) => catList(c.product).some((cat) => cat.slug === collection))

  const price = (c: (typeof all)[number]) => c.priceFrom ?? Number.MAX_SAFE_INTEGER
  if (sort === 'price-asc') results = [...results].sort((a, b) => price(a) - price(b))
  else if (sort === 'price-desc') results = [...results].sort((a, b) => price(b) - price(a))
  else if (sort === 'title') results = [...results].sort((a, b) => a.product.title.localeCompare(b.product.title))

  const qs = (over: Record<string, string>) => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (collection) p.set('collection', collection)
    if (sort && sort !== 'relevance') p.set('sort', sort)
    for (const [k, v] of Object.entries(over)) v ? p.set(k, v) : p.delete(k)
    const s = p.toString()
    return `/search${s ? `?${s}` : ''}`
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-8 pt-6 md:flex-row">
      {/* Collections */}
      <nav className="order-first w-full flex-none md:max-w-[140px]">
        <p className="mb-2 text-xs uppercase tracking-wide text-neutral-500">Collections</p>
        <ul className="flex flex-wrap gap-2 md:flex-col md:gap-0">
          <li>
            <Link href={qs({ collection: '' })} className={`block py-1.5 text-sm ${!collection ? 'font-semibold text-black dark:text-white' : 'text-neutral-500 hover:text-black dark:hover:text-white'}`}>All products</Link>
          </li>
          {collections.map(([slug, name]) => (
            <li key={slug}>
              <Link href={qs({ collection: slug })} className={`block py-1.5 text-sm ${collection === slug ? 'font-semibold text-black dark:text-white' : 'text-neutral-500 hover:text-black dark:hover:text-white'}`}>{name}</Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Grid */}
      <div className="order-last min-h-screen w-full md:order-none">
        {q && <p className="mb-4 text-sm text-neutral-500">{results.length === 0 ? 'No products found for ' : `Showing ${results.length} result${results.length === 1 ? '' : 's'} for `}<span className="font-semibold text-black dark:text-white">&ldquo;{q}&rdquo;</span></p>}
        {results.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ProductGridItems products={results.map((c) => ({ product: c.product, priceFrom: c.priceFrom }))} />
          </ul>
        ) : (
          <p className="py-20 text-center text-neutral-500">No products{q ? ' match your search' : ' yet'}.</p>
        )}
      </div>

      {/* Sort */}
      <nav className="order-none flex-none md:order-last md:w-[140px]">
        <p className="mb-2 text-xs uppercase tracking-wide text-neutral-500">Sort by</p>
        <ul>
          {SORTS.map((s) => (
            <li key={s.key}>
              <Link href={qs({ sort: s.key === 'relevance' ? '' : s.key })} className={`block py-1.5 text-sm ${(sort || 'relevance') === s.key ? 'font-semibold text-black dark:text-white' : 'text-neutral-500 hover:text-black dark:hover:text-white'}`}>{s.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
