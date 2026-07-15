import Link from 'next/link'

import { CartModal } from './cart-modal'

/** Top navigation (Vercel Commerce): logo · search · all · sign-in · cart. */
export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-neutral-200 bg-white/80 p-4 backdrop-blur-md dark:border-neutral-800 dark:bg-black/70 lg:px-6">
      <div className="flex items-center gap-6">
        <Link href="/" aria-label="Home" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-sm font-bold dark:border-neutral-700">D</span>
          <span className="hidden text-sm font-medium uppercase tracking-wide sm:block">Decor&apos;s K-Beauty</span>
        </Link>
        <Link href="/search" className="hidden text-sm text-neutral-500 transition-colors hover:text-black dark:hover:text-white md:block">All</Link>
      </div>

      <form action="/search" className="hidden w-full max-w-96 md:block">
        <div className="relative">
          <input name="q" placeholder="Search for products..." aria-label="Search" className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 pr-10 text-sm text-black placeholder:text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
          <span className="pointer-events-none absolute right-3 top-2.5 text-neutral-500" aria-hidden>⌕</span>
        </div>
      </form>

      <div className="flex items-center gap-2">
        <Link href="/account" className="hidden rounded-md border border-neutral-200 px-3 py-2 text-sm transition-colors hover:border-blue-600 dark:border-neutral-700 sm:block">Orders</Link>
        <CartModal />
      </div>
    </nav>
  )
}
