import Link from 'next/link'

import { getResumeOrderView } from '@/lib/commerce/resume'
import { Price } from '@/components/Price'
import { PayResumeClient } from './PayResumeClient'

export const dynamic = 'force-dynamic'

/**
 * Cold-browser continuation of the FB-webview flow (§13.5). The order is rehydrated from the resume
 * token + DB — there are no shared cookies here. This is the whole trick.
 */
export default async function PayResumePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const view = await getResumeOrderView(token)

  if (!view.valid) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">This payment link has expired</h1>
        <p className="mt-2 text-sm text-grey">Start again from your cart.</p>
        <Link href="/" className="mt-4 inline-block text-celadon-deep hover:underline">
          Browse products &rarr;
        </Link>
      </div>
    )
  }

  if (view.alreadyPaid) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-celadon-deep">Already paid</h1>
        <p className="mt-2 font-mono text-sm text-grey">Order {view.orderNumber}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold text-celadon-deep">Complete your payment</h1>
      <p className="mt-3 text-ink">
        Order <span className="font-mono text-sm">{view.orderNumber}</span>
      </p>
      <p className="mt-1 text-2xl">
        <Price amount={view.amount ?? null} className="text-celadon-deep" />
      </p>
      <PayResumeClient token={token} />
      <p className="mt-4 text-xs leading-relaxed text-grey">
        You’re in your normal browser now, so the secure payment page will open reliably.
      </p>
    </div>
  )
}
