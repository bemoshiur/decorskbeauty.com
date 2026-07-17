'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, Search, User, X } from 'lucide-react'
import { CartModal } from '@/components/commerce/cart-modal'
import { cn } from '@/lib/cn'

export type HeaderNavLink = { label: string; href: string }

/** Sticky glass header. Transparent over the hero, frosts + lifts on scroll. Admin-driven wordmark/nav. */
export function SiteHeader({
  wordmark,
  logoUrl,
  nav,
}: {
  wordmark: string
  logoUrl?: string | null
  nav: HeaderNavLink[]
}) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-30 transition-[background,box-shadow,border-color] duration-300',
        scrolled ? 'glass border-b border-line shadow-soft' : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-6 lg:px-8">
        {/* Left: brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="-ml-1 rounded-full p-2 text-ink hover:bg-mist lg:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/" className="flex items-center gap-2" aria-label={wordmark}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={wordmark} className="h-8 w-auto" />
            ) : (
              <span className="font-display text-lg font-semibold tracking-tight text-celadon-ink sm:text-xl">{wordmark}</span>
            )}
          </Link>
        </div>

        {/* Center: nav (desktop) */}
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-mist hover:text-celadon-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          <Link href="/search" aria-label="Search" className="rounded-full p-2.5 text-ink hover:bg-mist">
            <Search className="h-5 w-5" />
          </Link>
          <Link href="/account" aria-label="Account" className="rounded-full p-2.5 text-ink hover:bg-mist">
            <User className="h-5 w-5" />
          </Link>
          <CartModal />
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="glass border-t border-line lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-5 py-3 sm:px-6">
            {nav.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-3 text-base font-medium text-ink hover:bg-mist"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
