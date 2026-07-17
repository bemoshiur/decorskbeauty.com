import type { Variants, Transition } from 'framer-motion'

// Shared motion language for the storefront. Keep durations calm and premium (not bouncy toys).
// Every consumer must degrade gracefully under prefers-reduced-motion (see Reveal / useReducedMotion).

export const easeOutSoft: Transition['ease'] = [0.22, 0.8, 0.28, 1]

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOutSoft } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: easeOutSoft } },
}

export const blurUp: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: easeOutSoft } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: easeOutSoft } },
}

/** Parent that reveals children one after another. Pair with `staggerItem`. */
export const staggerParent = (stagger = 0.09, delayChildren = 0.05): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
})

export const staggerItem: Variants = fadeUp
