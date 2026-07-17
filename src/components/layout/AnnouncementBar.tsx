'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

export type AnnouncementMessage = { text: string; linkLabel?: string | null; linkHref?: string | null }

const BG: Record<string, string> = {
  'celadon-deep': 'bg-celadon-deep text-white',
  ink: 'bg-ink text-paper',
  grad: 'grad-cta text-white',
}

/** Rotating, dismissible announcement bar (admin-driven). Dismissal persists for the session. */
export function AnnouncementBar({ messages, background = 'celadon-deep' }: { messages: AnnouncementMessage[]; background?: string }) {
  const reduce = useReducedMotion()
  const [dismissed, setDismissed] = useState(true)
  const [i, setI] = useState(0)

  useEffect(() => {
    setDismissed(sessionStorage.getItem('dkb-annc-dismissed') === '1')
  }, [])

  useEffect(() => {
    if (messages.length <= 1 || reduce) return
    const t = setInterval(() => setI((n) => (n + 1) % messages.length), 5000)
    return () => clearInterval(t)
  }, [messages.length, reduce])

  if (dismissed || messages.length === 0) return null
  const msg = messages[i % messages.length]

  return (
    <div className={cn('relative z-40 text-center text-sm', BG[background] ?? BG['celadon-deep'])}>
      <div className="mx-auto flex min-h-9 max-w-7xl items-center justify-center gap-2 px-10 py-2">
        <AnimatePresence mode="wait">
          <m.p
            key={i}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="font-medium"
          >
            {msg.text}
            {msg.linkHref && msg.linkLabel && (
              <Link href={msg.linkHref} className="ml-2 underline underline-offset-2 hover:opacity-80">
                {msg.linkLabel}
              </Link>
            )}
          </m.p>
        </AnimatePresence>
      </div>
      <button
        type="button"
        onClick={() => {
          setDismissed(true)
          sessionStorage.setItem('dkb-annc-dismissed', '1')
        }}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 opacity-80 hover:bg-white/15 hover:opacity-100"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}
