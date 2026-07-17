'use client'

import { useState } from 'react'
import { ShieldCheck, Truck, RotateCcw, ShoppingBag } from 'lucide-react'
import { OrderForm } from '@/components/store/OrderForm'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

export type BuyVariant = { id: number; label: string; price: number; mrp: number; availableQty: number }

const bdt = (n: number) => `৳${n.toLocaleString('en-US')}`

const PAY_LABEL: Record<string, string> = { cod: 'Cash on Delivery', bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket', upay: 'Upay', visa: 'Visa', mastercard: 'Mastercard' }

/** The product-page purchase panel: variant selector + live price + the COD-first OrderForm (which owns
 *  the quote/OTP/order path, #2/#3/#7), plus payment marks and a trust strip. Client component. */
export function BuyPanel({
  productTitle,
  brand,
  badge,
  variants,
  preorder,
  highlights,
  paymentMethods,
  eta,
  freeShip,
}: {
  productTitle: string
  brand: string | null
  badge: 'bestseller' | 'new' | 'sale' | 'limited' | null
  variants: BuyVariant[]
  preorder: boolean
  highlights: string[]
  paymentMethods: string[]
  eta: string
  freeShip: string
}) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id)
  const [adding, setAdding] = useState(false)
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0]

  // Secondary path: add to cart (for buying several items together), then open the drawer.
  async function addToCart() {
    if (!selected) return
    setAdding(true)
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'add', variantId: selected.id, qty: 1 }),
      })
      window.dispatchEvent(new Event('cart:open'))
    } finally {
      setAdding(false)
    }
  }
  const discount = selected && selected.mrp > selected.price ? Math.round(((selected.mrp - selected.price) / selected.mrp) * 100) : 0
  // Honesty: never show a "SALE" badge unless there's an actual discount (trust-first brand).
  const shownBadge = badge === 'sale' && discount === 0 ? null : badge

  return (
    <div className="flex flex-col gap-5">
      <div>
        {brand && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-celadon-deep">{brand}</p>}
        <div className="mt-1 flex items-start gap-3">
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">{productTitle}</h1>
          {shownBadge && <Badge tone={shownBadge} className="mt-1 shrink-0" />}
        </div>
      </div>

      {/* Price */}
      {selected && (
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="font-mono text-3xl font-semibold text-ink">{bdt(selected.price)}</span>
          {discount > 0 && (
            <>
              <span className="font-mono text-lg text-grey line-through">{bdt(selected.mrp)}</span>
              <Badge tone="sale">-{discount}%</Badge>
            </>
          )}
        </div>
      )}

      {/* Highlights */}
      {highlights.length > 0 && (
        <ul className="flex flex-col gap-2">
          {highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-celadon-deep" aria-hidden />
              {h}
            </li>
          ))}
        </ul>
      )}

      {/* Variant selector */}
      {variants.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Choose an option</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedId(v.id)}
                className={cn(
                  'min-h-11 rounded-xl px-4 py-2 text-sm font-medium ring-1 transition-colors',
                  v.id === selectedId ? 'bg-celadon-deep text-paper ring-celadon-deep' : 'bg-cloud text-ink ring-line hover:ring-celadon',
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Secondary path: add to cart to buy several items together. */}
      <button
        type="button"
        onClick={addToCart}
        disabled={adding}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-cloud text-sm font-semibold text-celadon-ink ring-1 ring-line transition-colors hover:ring-celadon disabled:opacity-60"
      >
        <ShoppingBag className="h-4 w-4" aria-hidden />
        {adding ? 'Adding…' : 'Add to cart'}
      </button>

      {/* COD-first order form (owns quote/OTP/order). id target for the mobile sticky bar. */}
      <div id="order-form" className="rounded-card bg-cloud p-4 ring-1 ring-line shadow-soft sm:p-5">
        {selected && (
          <OrderForm
            key={selected.id}
            variantId={selected.id}
            unitPrice={selected.price}
            productTitle={productTitle}
            sku={selected.label}
            preorder={preorder}
          />
        )}
      </div>

      {/* Payment marks */}
      {paymentMethods.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-grey">Pay with</span>
          {paymentMethods.map((p) => (
            <span key={p} className="rounded-md bg-mist px-2.5 py-1 font-mono text-xs text-ink-soft">{PAY_LABEL[p] ?? p}</span>
          ))}
        </div>
      )}

      {/* Trust strip */}
      <div className="grid grid-cols-3 gap-3 border-t border-line pt-4 text-center text-xs text-ink-soft">
        <div className="flex flex-col items-center gap-1"><ShieldCheck className="h-5 w-5 text-celadon-deep" aria-hidden /><span>100% Authentic</span></div>
        <div className="flex flex-col items-center gap-1"><Truck className="h-5 w-5 text-celadon-deep" aria-hidden /><span>{eta}</span></div>
        <div className="flex flex-col items-center gap-1"><RotateCcw className="h-5 w-5 text-celadon-deep" aria-hidden /><span>{freeShip}</span></div>
      </div>
    </div>
  )
}
