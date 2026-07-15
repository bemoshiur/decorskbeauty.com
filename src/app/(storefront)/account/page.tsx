import Link from 'next/link'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'

import { verifyPhoneToken } from '@/lib/auth/otpToken'
import { getOrdersByPhone } from '@/lib/commerce/orders'

export const metadata: Metadata = { title: 'My orders', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const bdt = (n: number) => `৳${n.toLocaleString('en-US')}`
const STATUS_LABEL: Record<string, string> = {
  pending: 'Awaiting payment', confirmed: 'Confirmed', packed: 'Packed', handedToCourier: 'Handed to courier',
  inTransit: 'In transit', delivered: 'Delivered', returned: 'Returned', cancelled: 'Cancelled',
}

export default async function AccountPage() {
  const verified = verifyPhoneToken((await cookies()).get('dkb_phone')?.value)

  if (!verified) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">My orders</h1>
        <p className="mt-2 text-sm text-grey">Sign in with your mobile number to see your orders.</p>
        <Link href="/login" className="mt-5 inline-block rounded-[4px] bg-celadon-deep px-6 py-3 text-sm font-semibold text-paper">Sign in</Link>
      </div>
    )
  }

  const orders = await getOrdersByPhone(verified.phone)

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-ink">My orders</h1>
        <span className="font-mono text-xs text-grey">{verified.phone}</span>
      </div>

      {orders.length === 0 ? (
        <p className="mt-10 text-center text-grey">No orders yet. <Link href="/" className="text-celadon-deep underline">Start shopping →</Link></p>
      ) : (
        <ul className="mt-5 space-y-3">
          {orders.map((o) => (
            <li key={o.orderNumber} className="rounded-[6px] border border-grey/25 bg-white/60 p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold text-ink">{o.orderNumber}</span>
                <span className="rounded-[3px] bg-celadon/15 px-2 py-0.5 text-[11px] font-medium text-celadon-deep">{STATUS_LABEL[o.fulfilmentStatus] ?? o.fulfilmentStatus}</span>
              </div>
              <p className="mt-1 line-clamp-1 text-sm text-grey">{o.items.map((i) => `${i.title} × ${i.qty}`).join(', ')}</p>
              <div className="mt-2 flex items-center justify-between font-mono text-xs text-ink">
                <span>{o.itemCount} item{o.itemCount === 1 ? '' : 's'} · {o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : ''}</span>
                <span>Total {bdt(o.grandTotal)}{o.codAmount > 0 && o.paymentStatus !== 'paid' ? ` · COD ${bdt(o.codAmount)}` : ''}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
