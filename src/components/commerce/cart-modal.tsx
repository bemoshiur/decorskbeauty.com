'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

type Item = { variantId: number; productSlug: string; title: string; option: string | null; unitPrice: number; qty: number; lineTotal: number }
type Cart = { items: Item[]; subtotal: number }

const fmt = (n: number) => `৳${n.toLocaleString('en-US')}`

/** Slide-out cart (Vercel Commerce). Opens on the `cart:open` event dispatched by Add-to-Cart. */
export function CartModal() {
  const [open, setOpen] = useState(false)
  const [cart, setCart] = useState<Cart>({ items: [], subtotal: 0 })

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

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const setQty = async (variantId: number, qty: number) => {
    await fetch('/api/cart', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'set', variantId, qty }) })
    refresh()
  }

  const count = cart.items.reduce((s, i) => s + i.qty, 0)

  return (
    <>
      <button aria-label={`Open cart (${count})`} onClick={() => { refresh(); setOpen(true) }} className="relative flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors hover:border-blue-600 dark:border-neutral-700 dark:text-white">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M6 6h15l-1.5 9h-12L6 6Z" /><path d="M6 6 5 3H2" /><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /></svg>
        {count > 0 && <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-blue-600 px-1 text-[11px] font-medium text-white">{count}</span>}
      </button>

      {open && <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />}
      <div className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-96 flex-col border-l border-neutral-200 bg-white/95 p-6 text-black backdrop-blur-xl transition-transform duration-300 dark:border-neutral-700 dark:bg-black/90 dark:text-white ${open ? 'translate-x-0' : 'translate-x-full'}`} role="dialog" aria-label="Shopping cart">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">My Cart</p>
          <button onClick={() => setOpen(false)} aria-label="Close cart" className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 dark:border-neutral-700">✕</button>
        </div>

        {cart.items.length === 0 ? (
          <div className="mt-20 flex grow flex-col items-center justify-center text-center">
            <p className="text-2xl font-bold">Your cart is empty.</p>
          </div>
        ) : (
          <div className="flex h-full flex-col justify-between overflow-hidden">
            <ul className="grow overflow-auto py-4">
              {cart.items.map((i) => (
                <li key={i.variantId} className="flex w-full flex-col border-b border-neutral-200 py-4 dark:border-neutral-700">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/products/${i.productSlug}`} onClick={() => setOpen(false)} className="text-sm font-medium leading-tight hover:underline">{i.title}</Link>
                    <button onClick={() => setQty(i.variantId, 0)} aria-label="Remove item" className="text-neutral-500 hover:text-red-600">✕</button>
                  </div>
                  {i.option && <p className="mt-0.5 text-xs text-neutral-500">{i.option}</p>}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-neutral-200 dark:border-neutral-700">
                      <button onClick={() => setQty(i.variantId, i.qty - 1)} aria-label="Reduce quantity" className="h-8 w-8">−</button>
                      <span className="w-8 text-center font-mono text-sm">{i.qty}</span>
                      <button onClick={() => setQty(i.variantId, i.qty + 1)} aria-label="Increase quantity" className="h-8 w-8">+</button>
                    </div>
                    <span className="font-mono text-sm">{fmt(i.lineTotal)}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="py-4 text-sm">
              <div className="mb-3 flex items-center justify-between border-t border-neutral-200 pt-3 dark:border-neutral-700">
                <span className="text-neutral-500">Subtotal</span>
                <span className="font-mono text-base font-semibold">{fmt(cart.subtotal)}</span>
              </div>
              <p className="mb-3 text-xs text-neutral-500">Delivery &amp; any advance are calculated at checkout.</p>
              <Link href="/checkout" onClick={() => setOpen(false)} className="block w-full rounded-full bg-blue-600 p-3 text-center text-sm font-medium text-white opacity-90 hover:opacity-100">Proceed to Checkout</Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
