'use client'

import { useEffect, useState } from 'react'

const bdt = (n: number) => `৳${n.toLocaleString('en-US')}`

/** Mobile-only sticky order bar (redesign). Appears once the form scrolls off; taps back to it. */
export function StickyOrderBar({ price, label = 'Order now' }: { price: number; label?: string }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const form = document.getElementById('order-form')
    if (!form) return
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting), { rootMargin: '0px 0px -40% 0px' })
    io.observe(form)
    return () => io.disconnect()
  }, [])

  const toForm = () => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  return (
    <div className={`fixed inset-x-0 bottom-0 z-30 border-t border-grey/30 bg-paper/95 p-3 backdrop-blur transition-transform sm:hidden ${show ? 'translate-y-0' : 'translate-y-full'}`}>
      {/* pr-16 reserves the bottom-right corner for the floating WhatsApp button so it never covers the CTA. */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 pr-16">
        <span className="font-mono text-base font-semibold text-celadon-deep">{bdt(price)}</span>
        <button onClick={toForm} className="min-h-11 flex-1 rounded-[4px] bg-celadon-deep px-5 py-3 text-sm font-semibold text-paper">{label}</button>
      </div>
    </div>
  )
}
