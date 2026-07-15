import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { RichText } from '@payloadcms/richtext-lexical/react'

import type { Ingredient, Media } from '@/payload-types'
import { getProductBySlug, getActiveVariants, getPublishedProductSlugs, getFefoLotForVariant, getRelatedProducts, effectivePrice } from '@/lib/commerce'
import { AuthenticitySlip } from '@/components/AuthenticitySlip'
import { Gallery } from '@/components/commerce/gallery'
import { ProductActions } from '@/components/commerce/product-actions'
import { GridTileImage, productImage } from '@/components/commerce/product-elements'
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

const mediaUrl = (m: unknown): string => {
  if (!m || typeof m !== 'object') return ''
  const md = m as Media
  const sizes = (md.sizes ?? {}) as Record<string, { url?: string | null } | undefined>
  return sizes.hero?.url || sizes.card?.url || md.url || ''
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const variants = await getActiveVariants(product.id)
  const returnPolicy = await getReturnPolicy()
  const related = await getRelatedProducts(product.id, 8)
  const brand = product.brand && typeof product.brand === 'object' ? product.brand : null
  const cheapest = variants[0]
  const fefoLot = cheapest ? await getFefoLotForVariant(cheapest.id) : null
  const preorder = product.fulfilmentMode === 'preOrder'
  const ingredients = (product.keyIngredients ?? []).filter((i): i is Ingredient => typeof i === 'object')

  const images = (product.images ?? []).map((im) => ({ url: mediaUrl(im.image), alt: im.alt ?? product.title })).filter((i) => i.url)
  const variantOptions = variants.map((v) => ({
    id: v.id,
    label: [v.optionSize, v.optionShade, v.optionBundle].filter(Boolean).join(' · ') || v.sku,
    price: effectivePrice(v),
    mrp: v.mrp,
    availableQty: v.availableQty ?? 0,
    preorder,
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <JsonLd
        data={graph(
          productJsonLd({ product, variants, returnPolicy }),
          faqPage(product.faq),
          breadcrumb([{ name: 'Home', path: '/' }, ...(brand ? [{ name: brand.name, path: `/products/${product.slug}` }] : []), { name: product.title, path: `/products/${product.slug}` }]),
        )}
      />

      <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-black md:p-10 lg:flex-row lg:gap-10">
        {/* Gallery */}
        <div className="h-full w-full basis-full lg:basis-4/6">
          <Gallery images={images} />
        </div>

        {/* Description */}
        <div className="basis-full lg:basis-2/6">
          {brand && <p className="mb-1 text-xs uppercase tracking-wide text-neutral-500">{brand.name}</p>}
          <h1 className="mb-4 text-3xl font-medium sm:text-4xl">{product.title}</h1>

          {variantOptions.length > 0 && <ProductActions variants={variantOptions} />}

          <p className="mt-4 text-xs text-neutral-500">
            {preorder ? `Pre-order · ships from Korea in ~${cheapest?.preOrderLeadDays ?? 15} days` : 'In stock · Cash on Delivery · 2–3 days in Dhaka'}
          </p>

          {product.shortDescription && <p className="mt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{product.shortDescription}</p>}

          {/* Authenticity slip — the K-Beauty signature, kept in a clean card */}
          <div className="mt-6">
            <AuthenticitySlip
              lot={fefoLot ? { lotCode: fefoLot.lotCode, mfgDate: fefoLot.mfgDate, expDate: fefoLot.expDate, importDate: fefoLot.importDate, poRef: fefoLot.poRef } : undefined}
              verifyHref={fefoLot ? `/verify?code=${encodeURIComponent(fefoLot.lotCode)}` : undefined}
            />
          </div>
        </div>
      </div>

      {/* Details: ingredients / INCI / how-to / FAQ / description */}
      <div className="mx-auto mt-10 max-w-3xl space-y-6 text-sm">
        {ingredients.length > 0 && (
          <section>
            <h2 className="mb-2 font-semibold">Key ingredients</h2>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ing) => (
                <Link key={ing.id} href={`/ingredients/${ing.slug}`} className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600 hover:border-blue-600 dark:border-neutral-700 dark:text-neutral-400">{ing.name}</Link>
              ))}
            </div>
          </section>
        )}
        {product.howToUse && (
          <section>
            <h2 className="mb-2 font-semibold">How to use</h2>
            <div className="leading-relaxed text-neutral-600 dark:text-neutral-400"><RichText data={product.howToUse} /></div>
          </section>
        )}
        {product.inci && (
          <details className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <summary className="cursor-pointer font-semibold">Full ingredients (INCI)</summary>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-neutral-500">{product.inci}</p>
          </details>
        )}
        {product.faq && product.faq.length > 0 && (
          <section className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <h2 className="mb-3 font-semibold">Questions</h2>
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {product.faq.map((f, i) => (
                <details key={i} className="py-2">
                  <summary className="cursor-pointer">{f.question}</summary>
                  <p className="mt-1 leading-relaxed text-neutral-500">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}
        {product.description && (
          <section className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <div className="leading-relaxed text-neutral-600 dark:text-neutral-400"><RichText data={product.description} /></div>
          </section>
        )}
      </div>

      {/* Related products carousel */}
      {related.length > 0 && (
        <div className="py-10">
          <h2 className="mb-4 text-2xl font-bold">Related Products</h2>
          <ul className="flex w-full gap-4 overflow-x-auto pt-1">
            {related.map((c) => {
              const img = productImage(c.product)
              return (
                <li key={c.product.id} className="aspect-square w-2/3 flex-none sm:w-1/3 md:w-1/4 lg:w-1/5">
                  <Link href={`/products/${c.product.slug}`} prefetch className="relative h-full w-full">
                    <GridTileImage src={img?.url} alt={img?.alt ?? c.product.title} label={{ title: c.product.title, amount: c.priceFrom }} />
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
