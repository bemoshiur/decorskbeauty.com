import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { ChevronRight, ShieldCheck } from 'lucide-react'

import type { Ingredient, Product } from '@/payload-types'
import {
  getProductBySlug, getActiveVariants, getPublishedProductSlugs, getRelatedProducts,
  listProductCardsByIds, getSiteSettings, effectivePrice,
} from '@/lib/commerce'
import { StoreGallery } from '@/components/shop/StoreGallery'
import { BuyPanel, type BuyVariant } from '@/components/shop/BuyPanel'
import { ProductCard } from '@/components/shop/ProductCard'
import { StickyOrderBar } from '@/components/store/StickyOrderBar'
import { Section } from '@/components/ui/Section'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/home/SectionHeading'
import { RevealGroup, RevealItem } from '@/components/motion/Reveal'
import { JsonLd } from '@/components/JsonLd'
import { graph, productJsonLd, faqPage, breadcrumb } from '@/lib/seo/jsonld'
import { getReturnPolicy } from '@/lib/seo/settings'

export const revalidate = 300

export async function generateStaticParams() {
  const slugs = await getPublishedProductSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = await getProductBySlug(slug)
  if (!p) return {}
  return {
    title: p.seo?.metaTitle ?? p.title,
    description: p.seo?.metaDescription ?? p.shortDescription ?? undefined,
    alternates: { canonical: `/products/${slug}` },
  }
}

const BADGE = { bestseller: 'bestseller', new: 'new', sale: 'sale', limited: 'limited' } as const

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const [variants, returnPolicy, settings] = await Promise.all([
    getActiveVariants(product.id),
    getReturnPolicy(),
    getSiteSettings(),
  ])

  // cross-sell: curated first, else algorithmic related
  const crossIds = (product.crossSell ?? []).map((c) => (typeof c === 'object' ? c.id : c)).filter((n): n is number => typeof n === 'number')
  const related = crossIds.length ? await listProductCardsByIds(crossIds) : await getRelatedProducts(product.id, 8)

  const brand = product.brand && typeof product.brand === 'object' ? product.brand.name : null
  const preorder = product.fulfilmentMode === 'preOrder'
  const ingredients = (product.keyIngredients ?? []).filter((i): i is Ingredient => typeof i === 'object')
  const highlights = (product.highlights ?? []).map((h) => h.text).filter(Boolean) as string[]
  const badge = product.homeBadge && product.homeBadge !== 'none' ? BADGE[product.homeBadge as keyof typeof BADGE] : product.isNew ? 'new' : null

  const images = (product.images ?? []).map((im) => ({ media: im.image, alt: im.alt ?? product.title }))
  const buyVariants: BuyVariant[] = variants.map((v) => ({
    id: v.id,
    label: [v.optionSize, v.optionShade, v.optionBundle].filter(Boolean).join(' · ') || v.sku,
    price: effectivePrice(v),
    mrp: v.mrp,
    availableQty: v.availableQty ?? 0,
  }))
  const cheapest = buyVariants[0]

  const paymentMethods = (settings?.footer?.paymentMethods as string[] | undefined) ?? ['cod', 'bkash', 'nagad']
  const eta = settings?.deliveryPromise?.etaCopy ?? '2–3 days in Dhaka'
  const freeShip = settings?.deliveryPromise?.freeShipHeadline ?? 'Free over ৳4,999'
  const authenticityCopy = settings?.productPage?.authenticityCopy ?? 'Every unit ships sealed from a tracked import lot with a batch code you can verify.'

  return (
    <>
      <JsonLd
        data={graph(
          productJsonLd({ product, variants, returnPolicy }),
          faqPage(product.faq),
          breadcrumb([
            { name: 'Home', path: '/' },
            ...(brand ? [{ name: brand, path: `/products/${product.slug}` }] : []),
            { name: product.title, path: `/products/${product.slug}` },
          ]),
        )}
      />

      {/* Breadcrumb */}
      <Container className="pt-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-grey">
          <Link href="/" className="hover:text-celadon-deep">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <Link href="/search" className="hover:text-celadon-deep">Shop</Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <span className="line-clamp-1 text-ink-soft">{product.title}</span>
        </nav>
      </Container>

      {/* Main: gallery + buy panel */}
      <Container className="grid gap-10 py-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <StoreGallery images={images} />
        </div>
        <div>
          <BuyPanel
            productTitle={product.title}
            brand={brand}
            badge={badge}
            variants={buyVariants}
            preorder={preorder}
            highlights={highlights}
            paymentMethods={paymentMethods}
            eta={eta}
            freeShip={freeShip}
          />
          {product.shortDescription && <p className="mt-6 text-[0.95rem] leading-relaxed text-ink-soft">{product.shortDescription}</p>}
          <div className="mt-5 flex items-start gap-3 rounded-card bg-mist/60 p-4 text-sm text-ink-soft">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-celadon-deep" aria-hidden />
            <p>
              {authenticityCopy}{' '}
              <Link href="/verify" className="font-medium text-celadon-deep underline underline-offset-2">Verify a batch →</Link>
            </p>
          </div>
        </div>
      </Container>

      {/* Details */}
      <Section surface="cloud" spacing="md" containerSize="narrow">
        <div className="flex flex-col gap-8 text-[0.95rem] leading-relaxed text-ink-soft">
          {ingredients.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-ink">Key ingredients</h2>
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ing) => (
                  <Link key={ing.id} href={`/ingredients/${ing.slug}`} className="rounded-full bg-paper px-3.5 py-1.5 text-sm text-ink-soft ring-1 ring-line transition-colors hover:ring-celadon">{ing.name}</Link>
                ))}
              </div>
            </section>
          )}
          {product.howToUse && (
            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-ink">How to use</h2>
              <div className="prose-sm max-w-none"><RichText data={product.howToUse} /></div>
            </section>
          )}
          {product.description && (
            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-ink">About this product</h2>
              <div className="prose-sm max-w-none"><RichText data={product.description} /></div>
            </section>
          )}
          {product.inci && (
            <details className="rounded-card bg-paper p-4 ring-1 ring-line">
              <summary className="cursor-pointer font-medium text-ink">Full ingredients (INCI)</summary>
              <p className="mt-3 font-mono text-[11px] leading-relaxed text-grey">{product.inci}</p>
            </details>
          )}
          {product.faq && product.faq.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-ink">Questions &amp; answers</h2>
              <div className="flex flex-col gap-2">
                {product.faq.map((f, i) => (
                  <details key={i} className="rounded-card bg-paper p-4 ring-1 ring-line">
                    <summary className="cursor-pointer font-medium text-ink">{f.question}</summary>
                    <p className="mt-2 text-sm text-ink-soft">{f.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>
      </Section>

      {/* Cross-sell */}
      {related.length > 0 && (
        <Section surface="paper" spacing="md">
          <SectionHeading title="You may also like" align="left" className="mb-8" />
          <RevealGroup className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {related.slice(0, 4).map((c) => (
              <RevealItem key={c.product.id} className="[&>a]:h-full">
                <ProductCard data={c as { product: Product; priceFrom: number | null }} />
              </RevealItem>
            ))}
          </RevealGroup>
        </Section>
      )}

      {cheapest && <StickyOrderBar price={cheapest.price} label={preorder ? 'Pre-order now' : 'Order now'} />}
    </>
  )
}
