'use client'

import { useState } from 'react'

export type VariantOption = { id: number; label: string; price: number; mrp: number; availableQty: number; preorder: boolean }

const fmt = (n: number) => `৳${n.toLocaleString('en-US')}`

/** VariantSelector + Price + AddToCart (Vercel Commerce product description block). */
export function ProductActions({ variants }: { variants: VariantOption[] }) {
  const [sel, setSel] = useState<number>(variants.find((v) => v.availableQty > 0 || v.preorder)?.id ?? variants[0]?.id)
  const [busy, setBusy] = useState(false)
  const v = variants.find((x) => x.id === sel) ?? variants[0]
  if (!v) return null
  const soldOut = v.availableQty <= 0 && !v.preorder

  async function add() {
    setBusy(true)
    try {
      await fetch('/api/cart', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'add', variantId: v.id, qty: 1 }) })
      window.dispatchEvent(new Event('cart:open'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {/* Price */}
      <div className="mb-6 flex items-center gap-3">
        <span className="rounded-full bg-blue-600 px-3 py-1.5 font-mono text-lg text-white">{fmt(v.price)}</span>
        {v.price < v.mrp && <s className="font-mono text-neutral-500">{fmt(v.mrp)}</s>}
      </div>

      {/* Variant pills */}
      {variants.length > 1 && (
        <dl className="mb-6">
          <dt className="mb-2 text-sm uppercase tracking-wide text-neutral-500">Options</dt>
          <dd className="flex flex-wrap gap-2">
            {variants.map((x) => {
              const out = x.availableQty <= 0 && !x.preorder
              return (
                <button
                  key={x.id}
                  onClick={() => setSel(x.id)}
                  disabled={out}
                  title={out ? `${x.label} — out of stock` : x.label}
                  className={`flex min-w-11 items-center justify-center rounded-full border px-3 py-2 text-sm ${
                    x.id === sel ? 'cursor-default border-blue-600 ring-2 ring-blue-600' : 'border-neutral-300 dark:border-neutral-700'
                  } ${out ? 'relative z-10 cursor-not-allowed overflow-hidden text-neutral-400 before:absolute before:inset-x-0 before:-z-10 before:h-px before:-rotate-45 before:bg-neutral-300' : 'hover:border-blue-600'}`}
                >
                  {x.label}
                </button>
              )
            })}
          </dd>
        </dl>
      )}

      <button
        onClick={add}
        disabled={busy || soldOut}
        aria-label="Add to cart"
        className="relative flex w-full items-center justify-center rounded-full bg-blue-600 p-4 text-sm font-medium tracking-wide text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {soldOut ? 'Out of Stock' : busy ? 'Adding…' : v.preorder ? 'Pre-order' : 'Add To Cart'}
      </button>
    </div>
  )
}
