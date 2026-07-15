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
        <nav className="flex items-center gap-4 text-sm text-ink sm:gap-5">
          <Link href="/" className="hover:text-celadon-deep">
            Shop
          </Link>
          <Link href="/account" className="hover:text-celadon-deep">
            My orders
          </Link>
          <Link href="/login" className="rounded-[4px] border border-celadon-deep px-3 py-1.5 text-xs font-medium text-celadon-deep hover:bg-celadon/10">
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  )
}
