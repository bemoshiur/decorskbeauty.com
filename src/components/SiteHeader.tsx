import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-grey/30 bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-lg font-semibold text-celadon-deep">Decor&rsquo;s K-Beauty</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-grey">
            Authentic Korean skincare · Banani
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-ink">
          <Link href="/" className="hover:text-celadon-deep">
            Shop
          </Link>
          <a
            href="https://wa.me/8801712113032"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-celadon-deep"
          >
            WhatsApp
          </a>
        </nav>
      </div>
    </header>
  )
}
