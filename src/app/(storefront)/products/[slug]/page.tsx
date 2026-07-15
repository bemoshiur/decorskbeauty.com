import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { RichText } from '@payloadcms/richtext-lexical/react'

import type { Ingredient } from '@/payload-types'
import { getProductBySlug, getActiveVariants, getPublishedProductSlugs, getFefoLotForVariant } from '@/lib/commerce'
import { addToCartAction } from '../../cart-actions'
import { ResponsiveImage } from '@/components/ResponsiveImage'
import { Price } from '@/components/Price'
import { AuthenticitySlip } from '@/components/AuthenticitySlip'
import { JsonLd } from '@/components/JsonLd'
import { graph, productJsonLd, faqPage, breadcrumb } from '@/lib/seo/jsonld'
import { getReturnPolicy } from '@/lib/seo/settings'

export const revalidate = 300

export async function generateStaticParams() {
  const slugs = await getPublishedProductSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const p = await getProductBySlug(slug)
  if (!p) return {}
  return {
    title: p.seo?.metaTitle ?? p.title,
    description: p.seo?.metaDescription ?? p.shortDescription ?? undefined,
    alternates: { canonical: `/products/${slug}` }, // self-referencing canonical (§14.1)
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const variants = await getActiveVariants(product.id)
  const returnPolicy = await getReturnPolicy()
  const brand = product.brand && typeof product.brand === 'object' ? product.brand : null
  const cheapest = variants[0]
  const fefoLot = cheapest ? await getFefoLotForVariant(cheapest.id) : null
  const hero = product.images?.[0]
  const preorder = product.fulfilmentMode === 'preOrder'
  const ingredients = (product.keyIngredients ?? []).filter(
    (i): i is Ingredient => typeof i === 'object',
  )
  const waText = encodeURIComponent(
    `Hi, I'd like to order: ${product.title}${cheapest?.sku ? ` — SKU ${cheapest.sku}` : ''}`,
  )

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      {/* Structured data (§14.2): Product+Offer (SKU #1, shippingDetails, returns), FAQPage, breadcrumb.
          No AggregateRating — there are no approved reviews to emit one from (#12/#29). */}
      <JsonLd
        data={graph(
          productJsonLd({ product, variants, returnPolicy }),
          faqPage(product.faq),
          breadcrumb([
            { name: 'Home', path: '/' },
            ...(brand ? [{ name: brand.name, path: `/products/${product.slug}` }] : []),
            { name: product.title, path: `/products/${product.slug}` },
          ]),
        )}
      />
      <div className="grid gap-8 lg:grid-cols-2">
        {/* 1. Image gallery */}
        <div className="flex flex-col gap-3">
          <div className="border border-grey/30 bg-paper">
            <ResponsiveImage
              media={hero?.image}
              alt={hero?.alt ?? product.title}
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="w-full object-cover"
            />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(0, 4).map((im, i) => (
                <div key={i} className="border border-grey/20 bg-paper">
                  <ResponsiveImage media={im.image} alt={im.alt ?? ''} sizes="15vw" className="w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column follows §6.1 exactly — proof before persuasion */}
        <div className="flex flex-col gap-5">
          {/* 2. Title (EN) + brand + price */}
          <div>
            {brand && (
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-grey">{brand.name}</p>
            )}
            <h1 className="mt-1 text-2xl font-semibold leading-tight text-ink">{product.title}</h1>
            {cheapest && (
              <div className="mt-2 text-xl">
                <Price amount={cheapest.mrp} sale={cheapest.salePrice} className="text-celadon-deep" />
              </div>
            )}
          </div>

          {/* 3. Variant selector (display only in Phase 1; cart is Phase 3) */}
          {variants.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <span
                  key={v.id}
                  className="rounded-[4px] border border-grey/40 px-3 py-1 font-mono text-xs text-ink"
                >
                  {[v.optionSize, v.optionShade, v.optionBundle].filter(Boolean).join(' · ') || v.sku}
                </span>
              ))}
            </div>
          )}

          {/* 4. Authenticity slip — the signature, wired to the FEFO lot (§16.4) */}
          <AuthenticitySlip
            lot={
              fefoLot
                ? {
                    lotCode: fefoLot.lotCode,
                    mfgDate: fefoLot.mfgDate,
                    expDate: fefoLot.expDate,
                    importDate: fefoLot.importDate,
                    poRef: fefoLot.poRef,
                  }
                : undefined
            }
            verifyHref={fefoLot ? `/verify?code=${encodeURIComponent(fefoLot.lotCode)}` : undefined}
          />

          {/* 5. Stock + delivery promise (+ the EXP of the lot FEFO would ship, §10.2) */}
          <div className="font-mono text-xs text-grey">
            <p>
              {preorder
                ? `Pre-order · ships from Korea in ~${cheapest?.preOrderLeadDays ?? 15} days`
                : 'In stock · 2–3 days in Dhaka'}
            </p>
            {fefoLot?.expDate && (
              <p>
                Current lot expires <span className="text-ink">{fefoLot.expDate}</span>
              </p>
            )}
          </div>

          {/* 6. Add to cart + WhatsApp (§7) */}
          <div className="flex flex-wrap items-center gap-3">
            {cheapest && (
              <form action={addToCartAction}>
                <input type="hidden" name="variantId" value={cheapest.id} />
                <button
                  type="submit"
                  className="rounded-[4px] bg-celadon-deep px-5 py-2.5 text-sm text-paper transition-colors hover:bg-celadon"
                >
                  Add to cart
                </button>
              </form>
            )}
            <a
              href={`https://wa.me/8801712113032?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[4px] border border-celadon-deep px-5 py-2.5 text-sm text-celadon-deep transition-colors hover:bg-celadon/10"
            >
              Order on WhatsApp
            </a>
          </div>

          {/* 7. Short description */}
          {product.shortDescription && <p className="leading-relaxed text-ink">{product.shortDescription}</p>}

          {/* 8. Key ingredients */}
          {ingredients.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-ink">Key ingredients</h2>
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ing) => (
                  <span
                    key={ing.id}
                    className="rounded-[4px] border border-celadon/50 bg-celadon/10 px-2.5 py-1 text-xs text-celadon-deep"
                  >
                    {ing.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 9. Full INCI (collapsible) */}
          {product.inci && (
            <details className="border-t border-grey/30 pt-3">
              <summary className="cursor-pointer text-sm font-semibold text-ink">Full ingredients (INCI)</summary>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-grey">{product.inci}</p>
            </details>
          )}

          {/* 10. How to use */}
          {product.howToUse && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-ink">How to use</h2>
              <div className="prose-sm leading-relaxed text-ink">
                <RichText data={product.howToUse} />
              </div>
            </div>
          )}

          {/* 11. FAQ */}
          {product.faq && product.faq.length > 0 && (
            <div className="border-t border-grey/30 pt-4">
              <h2 className="mb-3 text-sm font-semibold text-ink">Questions</h2>
              <div className="flex flex-col divide-y divide-grey/20">
                {product.faq.map((f, i) => (
                  <details key={i} className="py-2">
                    <summary className="cursor-pointer text-sm text-ink">{f.question}</summary>
                    <p className="mt-1 text-sm leading-relaxed text-grey">{f.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Long description below the fold */}
      {product.description && (
        <section className="mt-10 max-w-3xl border-t border-grey/30 pt-6">
          <div className="leading-relaxed text-ink">
            <RichText data={product.description} />
          </div>
        </section>
      )}
    </article>
  )
}
