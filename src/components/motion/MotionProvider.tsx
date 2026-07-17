'use client'

import { LazyMotion, domAnimation, MotionConfig } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * One motion root for the storefront. LazyMotion + domAnimation loads only DOM animation features
 * (keeps the framer-motion payload small), and MotionConfig reducedMotion="user" makes every
 * `m.*` component honor the OS prefers-reduced-motion setting automatically.
 * Consumers use `m.div` etc. from framer-motion (NOT `motion.div`) so tree-shaking holds.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}
