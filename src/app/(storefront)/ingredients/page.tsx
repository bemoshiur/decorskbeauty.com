import Link from 'next/link'
import type { Metadata } from 'next'

import { listIngredients } from '@/lib/commerce'
import { JsonLd } from '@/components/JsonLd'
import { graph, definedTermSet, breadcrumb } from '@/lib/seo/jsonld'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Ingredient glossary',
  description: 'Plain-language answers on the Korean skincare ingredients that matter — what they do, who they suit, and what to watch for.',
  alternates: { canonical: '/ingredients' },
}

export default async function IngredientsIndex() {
  const ingredients = await listIngredients()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <JsonLd data={graph(definedTermSet(ingredients), breadcrumb([{ name: 'Home', path: '/' }, { name: 'Ingredients', path: '/ingredients' }]))} />

      <header className="border-b border-grey/30 pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-grey">Glossary</p>
        <h1 className="mt-2 text-2xl font-semibold text-celadon-deep">K-beauty ingredients, explained</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink">
          What each active actually does, who it suits, and what to watch for — one clear answer per ingredient.
        </p>
      </header>

      {ingredients.length > 0 ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {ingredients.map((ing) => (
            <li key={ing.id} className="border border-grey/25 bg-paper p-4">
              <Link href={`/ingredients/${ing.slug}`} className="font-semibold text-ink hover:text-celadon-deep">
                {ing.name}
              </Link>
              {ing.benefits && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-grey">{ing.benefits}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 text-center text-grey">The glossary is being written. Check back shortly.</p>
      )}
    </div>
  )
}
