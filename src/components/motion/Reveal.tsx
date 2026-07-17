'use client'

import { m, useReducedMotion } from 'framer-motion'
import type { ReactNode, ElementType } from 'react'
import { fadeUp, staggerParent, staggerItem } from './variants'
import type { Variants } from 'framer-motion'

type RevealProps = {
  children: ReactNode
  className?: string
  /** motion variants to use (default: fadeUp) */
  variants?: Variants
  /** delay before the reveal starts (seconds) */
  delay?: number
  /** how much of the element must be in view before revealing (0–1) */
  amount?: number
  as?: ElementType
}

/**
 * Scroll-triggered reveal. Animates once when it enters the viewport, and becomes a plain element
 * (no transform) when the user prefers reduced motion — content is always present and readable.
 * Requires a <MotionProvider> ancestor (LazyMotion). Client component.
 */
export function Reveal({ children, className, variants = fadeUp, delay = 0, amount = 0.05, as }: RevealProps) {
  const reduce = useReducedMotion()
  const Tag = (as ?? 'div') as ElementType
  const MTag = m[Tag as keyof typeof m] as typeof m.div

  if (reduce) return <Tag className={className}>{children}</Tag>

  return (
    <MTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      // Fire as soon as a sliver approaches the viewport (reliable even on fast scroll); reveal once.
      viewport={{ once: true, amount, margin: '0px 0px -80px 0px' }}
      transition={{ delay }}
    >
      {children}
    </MTag>
  )
}

/**
 * Reveals its direct <RevealItem> children in sequence as the group scrolls into view.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  amount = 0.05,
  as,
}: {
  children: ReactNode
  className?: string
  stagger?: number
  amount?: number
  as?: ElementType
}) {
  const reduce = useReducedMotion()
  const Tag = (as ?? 'div') as ElementType
  const MTag = m[Tag as keyof typeof m] as typeof m.div

  if (reduce) return <Tag className={className}>{children}</Tag>

  return (
    <MTag
      className={className}
      variants={staggerParent(stagger)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount, margin: '0px 0px -80px 0px' }}
    >
      {children}
    </MTag>
  )
}

/** A single staggered child inside <RevealGroup>. */
export function RevealItem({ children, className, as }: { children: ReactNode; className?: string; as?: ElementType }) {
  const reduce = useReducedMotion()
  const Tag = (as ?? 'div') as ElementType
  const MTag = m[Tag as keyof typeof m] as typeof m.div

  if (reduce) return <Tag className={className}>{children}</Tag>
  return (
    <MTag className={className} variants={staggerItem}>
      {children}
    </MTag>
  )
}
