import Link from 'next/link'
import type { Metadata } from 'next'

import { getCartView } from '@/lib/commerce/cart'
import { CheckoutClient } from './CheckoutClient'

export const metadata: Metadata = { title: 'Checkout' }
export const dynamic = 'force-dynamic' // cart is per-user (cookie); never cached/prerendered

export default async function CheckoutPage() {
  const cart = await getCartView()

  if (!cart.items.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">Your cart is empty</h1>
        <p className="mt-2 text-sm text-grey">Add something authentic to get started.</p>
        <Link href="/" className="mt-4 inline-block text-celadon-deep underline-offset-2 hover:underline">
          Browse products &rarr;
        </Link>
      </div>
    )
  }

  return <CheckoutClient items={cart.items} subtotal={cart.subtotal} />
}
