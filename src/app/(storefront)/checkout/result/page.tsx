import Link from 'next/link'

export const dynamic = 'force-dynamic'

const MESSAGES: Record<string, { title: string; body: string; tone: 'good' | 'bad' | 'wait' }> = {
  success: { title: 'Order confirmed', body: 'Thank you! We’ve got your order and will send you an SMS with the details.', tone: 'good' },
  cancelled: { title: 'Payment cancelled', body: 'No payment was taken. You can try again from your cart.', tone: 'bad' },
  failed: { title: 'Payment failed', body: 'Your payment didn’t go through. Please try again or contact us on WhatsApp.', tone: 'bad' },
  confirming: { title: 'Confirming your payment', body: 'We’re checking with the gateway. This can take a moment — we’ll SMS you once it’s confirmed.', tone: 'wait' },
  error: { title: 'Something went wrong', body: 'We couldn’t complete this. Please contact us on WhatsApp with your order number.', tone: 'bad' },
}

export default async function ResultPage({ searchParams }: { searchParams: Promise<{ status?: string; order?: string }> }) {
  const { status = 'error', order } = await searchParams
  const m = MESSAGES[status] ?? MESSAGES.error
  const color = m.tone === 'good' ? 'text-celadon-deep' : m.tone === 'bad' ? 'text-seal' : 'text-ink'

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className={`text-2xl font-semibold ${color}`}>{m.title}</h1>
      {order && <p className="mt-2 font-mono text-sm text-grey">Order {order}</p>}
      <p className="mt-3 leading-relaxed text-ink">{m.body}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="rounded-[4px] bg-celadon-deep px-5 py-2 text-sm text-paper hover:bg-celadon">
          Keep shopping
        </Link>
        <a
          href="https://wa.me/8801712113032"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-[4px] border border-celadon-deep px-5 py-2 text-sm text-celadon-deep hover:bg-celadon/10"
        >
          WhatsApp us
        </a>
      </div>
    </div>
  )
}
