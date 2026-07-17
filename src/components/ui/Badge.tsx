import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'bestseller' | 'new' | 'sale' | 'limited' | 'celadon' | 'neutral' | 'seal'

const TONE: Record<Tone, string> = {
  bestseller: 'bg-honey/20 text-[#8a6a12] ring-honey/40',
  new: 'bg-sky/25 text-[#1c5566] ring-sky/50',
  sale: 'bg-rose-clay/25 text-[#a2493a] ring-rose-clay/50',
  limited: 'bg-lilac/30 text-[#524a86] ring-lilac/60',
  celadon: 'bg-celadon/18 text-celadon-ink ring-celadon/40',
  neutral: 'bg-mist text-ink-soft ring-line',
  seal: 'bg-seal/12 text-seal ring-seal/30', // rationed: authenticity/expiry
}

const LABEL: Partial<Record<Tone, string>> = {
  bestseller: 'Best seller',
  new: 'New',
  sale: 'Sale',
  limited: 'Limited',
}

/** Small merchandising / status pill. Pass children to override the default label for known tones. */
export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone
  children?: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset',
        TONE[tone],
        className,
      )}
    >
      {children ?? LABEL[tone] ?? tone}
    </span>
  )
}
