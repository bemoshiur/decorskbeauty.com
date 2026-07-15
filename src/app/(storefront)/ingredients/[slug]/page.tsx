import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { RichText } from '@payloadcms/richtext-lexical/react'

import { getIngredientBySlug, getIngredientSlugs } from '@/lib/commerce'
import { JsonLd } from '@/components/JsonLd'
import { graph, definedTerm, breadcrumb } from '@/lib/seo/jsonld'

export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await getIngredientSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const ing = await getIngredientBySlug(slug)
  if (!ing) return {}
  return {
    title: ing.seo?.metaTitle ?? `${ing.name} — ingredient guide`,
    description: ing.seo?.metaDescription ?? ing.benefits ?? undefined,
    alternates: { canonical: `/ingredients/${slug}` },
  }
}

export default async function IngredientPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ing = await getIngredientBySlug(slug)
  if (!ing) notFound()

  return (
    <article className="mx-auto max-w-2xl px-4 py-8">
      <JsonLd data={graph(definedTerm(ing), breadcrumb([{ name: 'Home', path: '/' }, { name: 'Ingredients', path: '/ingredients' }, { name: ing.name, path: `/ingredients/${slug}` }]))} />

      <nav className="font-mono text-xs text-grey">
        <Link href="/ingredients" className="hover:text-celadon-deep">
          ← Glossary
        </Link>
      </nav>
      <h1 className="mt-3 text-2xl font-semibold text-ink">{ing.name}</h1>

      {ing.definition && (
        <div className="prose-sm mt-4 leading-relaxed text-ink">
          <RichText data={ing.definition} />
        </div>
      )}

      {ing.benefits && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-ink">What it does</h2>
          <p className="mt-1 leading-relaxed text-ink">{ing.benefits}</p>
        </section>
      )}

      {ing.cautions && (
        <section className="mt-6 border-l-2 border-seal/50 pl-3">
          <h2 className="text-sm font-semibold text-ink">What to watch for</h2>
          <p className="mt-1 leading-relaxed text-grey">{ing.cautions}</p>
        </section>
      )}
    </article>
  )
}
