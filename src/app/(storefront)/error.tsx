'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surfaced to the platform logs; never expose internals to the buyer.
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[62vh] max-w-xl flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold text-ink">Something went wrong</h1>
      <p className="mt-3 text-ink-soft">We hit a snag loading this page. Please try again in a moment.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Button href="/" variant="secondary">Back home</Button>
      </div>
    </div>
  )
}
