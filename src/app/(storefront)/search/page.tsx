import Link from 'next/link'
import type { Metadata } from 'next'

import type { Category } from '@/payload-types'
import { listProductCards } from '@/lib/commerce'
import { Container } from '@/components/ui/Container'
import { ProductCard } from '@/components/shop/ProductCard'
import { RevealGroup, RevealItem } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

export const revalidate = 300
export const metadata: Metadata = { title: 'Shop all', alternates: { canonical: '/search' } }

const SORTS = [
  { key: 'relevance', label: 'Featured' },
  { key: 'price-asc', label: 'Price ↑' },
  { key: 'price-desc', label: 'Price ↓' },
  { key: 'title', label: 'A–Z' },
]

const catList = (p: { categories?: unknown }): Category[] =>
  ((p.categories ?? []) as unknown[]).filter((c): c is Category => typeof c === 'object' && c != null)

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; collection?: string; category?: string }>
}) {
  const params = await searchParams
  const { q = '', sort = 'relevance' } = params
  // Accept both ?collection= and ?category= (the homepage category tiles link with ?category=).
  const collection = params.collection || params.category || ''
  const all = await listProductCards()

  const catMap = new Map<string, string>()
  for (const c of all) for (const cat of catList(c.product)) if (cat.slug) catMap.set(cat.slug, cat.name)
  const collections = [...catMap.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  const activeCatName = collection ? catMap.get(collection) : null

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
    for (const [k, v] of Object.entries(over)) (v ? p.set(k, v) : p.delete(k))
    p.delete('category') // normalize onto ?collection=
    const s = p.toString()
    return `/search${s ? `?${s}` : ''}`
  }

  const heading = q ? `Results for “${q}”` : activeCatName || 'Shop all'

  return (
    <Container className="py-8 sm:py-10">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-line pb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{heading}</h1>
        <p className="text-sm text-grey">
          {results.length} {results.length === 1 ? 'product' : 'products'}
          {activeCatName && !q ? ' in this category' : ''}
        </p>
      </div>

      {/* Filter bar: category chips + sort chips */}
      <div className="mt-6 flex flex-col gap-4">
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
          <Link
            href={qs({ collection: '' })}
            className={cn(
              'flex-none rounded-full px-4 py-2 text-sm font-medium ring-1 transition-colors',
              !collection ? 'bg-celadon-deep text-paper ring-celadon-deep' : 'bg-cloud text-ink-soft ring-line hover:ring-celadon',
            )}
          >
            All
          </Link>
          {collections.map(([slug, name]) => (
            <Link
              key={slug}
              href={qs({ collection: slug })}
              className={cn(
                'flex-none rounded-full px-4 py-2 text-sm font-medium ring-1 transition-colors',
                collection === slug ? 'bg-celadon-deep text-paper ring-celadon-deep' : 'bg-cloud text-ink-soft ring-line hover:ring-celadon',
              )}
            >
              {name}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-grey">Sort</span>
          {SORTS.map((s) => {
            const active = (sort || 'relevance') === s.key
            return (
              <Link
                key={s.key}
                href={qs({ sort: s.key === 'relevance' ? '' : s.key })}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm transition-colors',
                  active ? 'bg-mist font-semibold text-celadon-ink' : 'text-ink-soft hover:bg-mist',
                )}
              >
                {s.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Grid */}
      {results.length > 0 ? (
        <RevealGroup className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {results.map((c) => (
            <RevealItem key={c.product.id} className="[&>a]:h-full">
              <ProductCard data={c} sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw" />
            </RevealItem>
          ))}
        </RevealGroup>
      ) : (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
          <p className="font-display text-2xl text-ink">No products {q ? 'match your search' : 'here yet'}</p>
          <p className="text-ink-soft">Try a different search or browse everything.</p>
          <Button href="/search" variant="secondary">Browse all products</Button>
        </div>
      )}
    </Container>
  )
}
