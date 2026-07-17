'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, X, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'

type Item = { variantId: number; productSlug: string; title: string; option: string | null; unitPrice: number; qty: number; lineTotal: number }
type Cart = { items: Item[]; subtotal: number }

const fmt = (n: number) => `৳${n.toLocaleString('en-US')}`

/** Slide-out cart. Opens on the `cart:open` event (dispatched by Add-to-Cart). Accessible dialog:
 *  aria-modal, Esc to close, focus moves in on open and restores on close, background scroll locked. */
export function CartModal() {
  const [open, setOpen] = useState(false)
  const [cart, setCart] = useState<Cart>({ items: [], subtotal: 0 })
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/cart', { cache: 'no-store' })
      setCart(await r.json())
    } catch {
      /* keep last */
    }
  }, [])

  useEffect(() => {
    refresh()
    const onOpen = () => { refresh(); setOpen(true) }
    const onUpdate = () => refresh()
    window.addEventListener('cart:open', onOpen)
    window.addEventListener('cart:updated', onUpdate)
    return () => {
      window.removeEventListener('cart:open', onOpen)
      window.removeEventListener('cart:updated', onUpdate)
    }
  }, [refresh])

  // Body scroll lock + focus management + Esc + basic focus trap.
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); return }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,[tabindex]:not([tabindex="-1"])')
        if (!focusables.length) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
      ;(previouslyFocused ?? triggerRef.current)?.focus?.()
    }
  }, [open])

  const setQty = async (variantId: number, qty: number) => {
    await fetch('/api/cart', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'set', variantId, qty }) })
    refresh()
  }

  const count = cart.items.reduce((s, i) => s + i.qty, 0)

  return (
    <>
      <button
        ref={triggerRef}
        aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}
        onClick={() => { refresh(); setOpen(true) }}
        className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-mist"
      >
        <ShoppingBag className="h-5 w-5" aria-hidden />
        {count > 0 && (
          <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-celadon-deep px-1 text-[11px] font-semibold text-white">{count}</span>
        )}
      </button>

      {open && <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-line bg-paper text-ink shadow-lift transition-transform duration-300 ease-out-soft',
          open ? 'translate-x-0' : 'pointer-events-none translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <p id="cart-title" className="font-display text-xl font-semibold">Your cart {count > 0 && <span className="text-grey">({count})</span>}</p>
          <button ref={closeRef} onClick={() => setOpen(false)} aria-label="Close cart" className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-mist">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {cart.items.length === 0 ? (
          <div className="flex grow flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-mist text-celadon-deep"><ShoppingBag className="h-7 w-7" aria-hidden /></span>
            <p className="font-display text-xl text-ink">Your cart is empty</p>
            <p className="text-sm text-ink-soft">Add a product, or order any single item straight from its page with Cash on Delivery.</p>
            <Link href="/search" onClick={() => setOpen(false)} className="grad-cta mt-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lift">Shop all products</Link>
          </div>
        ) : (
          <div className="flex h-full flex-col justify-between overflow-hidden">
            <ul className="grow overflow-auto px-6 py-2">
              {cart.items.map((i) => (
                <li key={i.variantId} className="flex w-full flex-col border-b border-line py-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/products/${i.productSlug}`} onClick={() => setOpen(false)} className="text-sm font-medium leading-tight text-ink hover:text-celadon-deep">{i.title}</Link>
                    <button onClick={() => setQty(i.variantId, 0)} aria-label="Remove item" className="text-grey transition-colors hover:text-seal"><X className="h-4 w-4" aria-hidden /></button>
                  </div>
                  {i.option && <p className="mt-0.5 text-xs text-grey">{i.option}</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-full ring-1 ring-line">
                      <button onClick={() => setQty(i.variantId, i.qty - 1)} aria-label="Reduce quantity" className="flex h-8 w-8 items-center justify-center text-ink hover:text-celadon-deep"><Minus className="h-4 w-4" aria-hidden /></button>
                      <span className="w-8 text-center font-mono text-sm">{i.qty}</span>
                      <button onClick={() => setQty(i.variantId, i.qty + 1)} aria-label="Increase quantity" className="flex h-8 w-8 items-center justify-center text-ink hover:text-celadon-deep"><Plus className="h-4 w-4" aria-hidden /></button>
                    </div>
                    <span className="font-mono text-sm font-semibold">{fmt(i.lineTotal)}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-6 py-5 text-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-ink-soft">Subtotal</span>
                <span className="font-mono text-base font-semibold text-ink">{fmt(cart.subtotal)}</span>
              </div>
              <p className="mb-3 text-xs text-grey">Delivery &amp; any advance are calculated at checkout.</p>
              <Link href="/checkout" onClick={() => setOpen(false)} className="grad-cta block w-full rounded-full p-3.5 text-center text-sm font-semibold text-white shadow-lift transition-shadow hover:shadow-glow">Proceed to checkout</Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
