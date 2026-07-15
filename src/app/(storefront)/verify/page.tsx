import Link from 'next/link'
import type { Metadata } from 'next'

import { verifyBatch } from '@/lib/commerce'

export const metadata: Metadata = {
  title: 'Verify a batch',
  description:
    'Enter the batch code printed on your Decor’s K-Beauty package to see its product, manufacture and expiry dates, and import documents.',
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <>
    <dt className="text-grey">{k}</dt>
    <dd className="text-ink">{v}</dd>
  </>
)

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  const query = (code ?? '').trim()
  const result = query ? await verifyBatch(query) : null

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-grey">Authenticity</p>
      <h1 className="mt-2 text-2xl font-semibold text-celadon-deep">Verify a batch</h1>
      <p className="mt-3 leading-relaxed text-ink">
        Every unit we sell ships from a tracked import lot. Enter the batch code printed on your package
        to see exactly what it is, when it was made and when it expires — and the scanned import papers.
      </p>

      <form method="get" className="mt-6 flex flex-wrap gap-2">
        <input
          name="code"
          defaultValue={query}
          placeholder="Batch code (e.g. SNP24K0917B)"
          aria-label="Batch code"
          className="min-w-0 flex-1 rounded-[4px] border border-grey/50 bg-white/60 px-3 py-2 font-mono text-sm text-ink outline-none focus:border-celadon"
        />
        <button
          type="submit"
          className="rounded-[4px] bg-celadon-deep px-5 py-2 text-sm text-paper transition-colors hover:bg-celadon"
        >
          Verify
        </button>
      </form>

      {query && result && (
        <section className="mt-8 border border-celadon-deep/40 bg-white/50 p-5 font-mono text-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="uppercase tracking-[0.18em] text-celadon-deep">Verified</span>
            <span aria-hidden className="inline-block h-3 w-3 rounded-full bg-seal" title="authentic" />
          </div>
          <dl className="grid grid-cols-[6rem_1fr] gap-x-4 gap-y-1.5">
            <Row k="LOT" v={result.lotCode} />
            {result.productTitle && (
              <>
                <dt className="text-grey">PRODUCT</dt>
                <dd>
                  {result.productSlug ? (
                    <Link href={`/products/${result.productSlug}`} className="text-celadon-deep underline-offset-2 hover:underline">
                      {result.brandName ? `${result.brandName} — ` : ''}
                      {result.productTitle}
                    </Link>
                  ) : (
                    <span className="text-ink">{result.productTitle}</span>
                  )}
                </dd>
              </>
            )}
            {result.mfgDate && <Row k="MFG" v={result.mfgDate} />}
            {result.expDate && <Row k="EXP" v={result.expDate} />}
            {result.importDate && <Row k="IMPORT" v={[result.importDate, result.poRef].filter(Boolean).join('  ·  ')} />}
          </dl>

          {result.docs.length > 0 && (
            <div className="mt-4 border-t border-grey/30 pt-3">
              <p className="mb-1 text-grey">Import documents</p>
              <ul className="flex flex-col gap-1">
                {result.docs.map((d, i) => (
                  <li key={i}>
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-celadon-deep underline-offset-2 hover:underline">
                      {d.label} &rarr;
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {query && !result && (
        <section className="mt-8 border border-grey/40 bg-white/40 p-5">
          <p className="text-ink">
            We couldn&rsquo;t find batch <span className="font-mono text-seal">{query}</span>.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-grey">
            If this code is printed on a package you bought from us, send it to us and we&rsquo;ll check it by hand.
          </p>
          <a
            href={`https://wa.me/8801712113032?text=${encodeURIComponent(`Please verify batch ${query}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-[4px] border border-celadon-deep px-4 py-2 text-sm text-celadon-deep hover:bg-celadon/10"
          >
            Ask us on WhatsApp
          </a>
        </section>
      )}
    </div>
  )
}
