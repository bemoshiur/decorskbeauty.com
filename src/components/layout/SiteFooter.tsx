import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { Container } from '@/components/ui/Container'

export type FooterColumn = { heading: string; links: { label: string; href: string }[] }
export type FooterSocial = { platform?: string | null; url: string }

const PAY_LABEL: Record<string, string> = {
  cod: 'Cash on Delivery', bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket', upay: 'Upay', visa: 'Visa', mastercard: 'Mastercard',
}

/** Admin-driven footer (columns, socials, payment marks, identity). Deep celadon surface. */
export function SiteFooter({
  wordmark,
  blurb,
  columns,
  socials,
  paymentMethods,
  contact,
  copyright,
}: {
  wordmark: string
  blurb?: string | null
  columns: FooterColumn[]
  socials: FooterSocial[]
  paymentMethods: string[]
  contact: { address?: string | null; phone?: string | null }
  copyright?: string | null
}) {
  const year = '2026'
  return (
    <footer className="mt-auto bg-celadon-ink text-paper">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          {/* Brand */}
          <div className="max-w-sm">
            <span className="font-display text-xl font-semibold tracking-tight">{wordmark}</span>
            {blurb && <p className="mt-3 text-sm leading-relaxed text-paper/70">{blurb}</p>}
            {socials.length > 0 && (
              <div className="mt-5 flex gap-2">
                {socials.map((s) => (
                  <a
                    key={s.url}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.platform ?? 'social'}
                    className="rounded-full bg-white/10 p-2.5 text-paper transition-colors hover:bg-white/20"
                  >
                    <Icon name={s.platform ?? undefined} className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Link columns */}
          {columns.slice(0, 3).map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-paper/90">{col.heading}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="text-sm text-paper/70 transition-colors hover:text-paper">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment marks */}
        {paymentMethods.length > 0 && (
          <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-white/10 pt-8">
            <span className="mr-1 text-xs uppercase tracking-wide text-paper/50">We accept</span>
            {paymentMethods.map((p) => (
              <span key={p} className="rounded-md bg-white/10 px-2.5 py-1 font-mono text-xs text-paper/90">
                {PAY_LABEL[p] ?? p}
              </span>
            ))}
          </div>
        )}

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 text-sm text-paper/60 sm:flex-row sm:items-center sm:justify-between">
          <p>{copyright || `© ${year} ${wordmark}`}</p>
          <p>
            {contact.address}
            {contact.address && contact.phone ? ' · ' : ''}
            {contact.phone}
          </p>
        </div>
      </Container>
    </footer>
  )
}
