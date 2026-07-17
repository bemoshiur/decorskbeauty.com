'use client'

import { useRef } from 'react'
import { m, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import type { HeroBlock } from '@/payload-types'
import { cn } from '@/lib/cn'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { GradientMesh } from '@/components/ui/GradientMesh'
import { StoreImage } from '@/components/ui/StoreImage'
import { easeOutSoft } from '@/components/motion/variants'

const SURFACE: Record<string, string> = {
  'mesh-hero': 'mesh-hero', 'mesh-mint': 'mesh-mint', 'mesh-bloom': 'mesh-bloom',
  paper: 'bg-paper', cloud: 'bg-cloud', mist: 'bg-mist', ink: 'bg-celadon-ink text-paper',
}

export function HeroSection({ block }: { block: HeroBlock }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90])

  const center = block.align === 'center'
  const primary = block.primaryCta
  const secondary = block.secondaryCta

  // Orchestrated load. The headline slides without hiding (opacity stays 1) so it stays LCP-friendly.
  const container = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } }
  const slideUp = { hidden: { y: reduce ? 0 : 22 }, show: { y: 0, transition: { duration: 0.6, ease: easeOutSoft } } }
  const fadeUp = { hidden: { opacity: 0, y: reduce ? 0 : 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOutSoft } } }

  return (
    <section ref={ref} className={cn('relative isolate overflow-hidden', SURFACE[block.theme ?? 'mesh-hero'])}>
      <GradientMesh />
      <Container className="relative py-16 sm:py-24 lg:py-28">
        <div className={cn('grid items-center gap-12 lg:grid-cols-2 lg:gap-8', center && 'lg:grid-cols-1')}>
          {/* Copy */}
          <m.div
            variants={container}
            initial="hidden"
            animate="show"
            className={cn('flex flex-col gap-6', center ? 'mx-auto max-w-3xl items-center text-center' : 'items-start')}
          >
            {block.eyebrow && (
              <m.span
                variants={fadeUp}
                className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-celadon-deep ring-1 ring-celadon/30 backdrop-blur"
              >
                {block.eyebrow}
              </m.span>
            )}
            <m.h1
              variants={slideUp}
              className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl"
            >
              {block.headline}
              {block.headlineAccent && <span className="text-gradient"> {block.headlineAccent}</span>}
            </m.h1>
            {block.subheadline && (
              <m.p variants={fadeUp} className={cn('max-w-xl text-lg leading-relaxed text-ink-soft', center && 'mx-auto')}>
                {block.subheadline}
              </m.p>
            )}
            {(primary?.href || secondary?.href) && (
              <m.div variants={fadeUp} className="flex flex-wrap items-center gap-3 pt-1">
                {primary?.href && primary?.label && (
                  <Button href={primary.href} size="lg">{primary.label}</Button>
                )}
                {secondary?.href && secondary?.label && (
                  <Button href={secondary.href} variant="secondary" size="lg">{secondary.label}</Button>
                )}
              </m.div>
            )}
            {block.floatingBadges && block.floatingBadges.length > 0 && (
              <m.ul variants={fadeUp} className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-ink-soft">
                {block.floatingBadges.map((b) => (
                  <li key={b.id} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-celadon-deep" aria-hidden />
                    {b.text}
                  </li>
                ))}
              </m.ul>
            )}
          </m.div>

          {/* Visual */}
          {!center && (
            <m.div
              style={{ y }}
              initial={reduce ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: easeOutSoft, delay: 0.1 }}
              className="relative mx-auto w-full max-w-lg"
            >
              <div className="overflow-hidden rounded-feature shadow-lift ring-1 ring-white/40">
                <StoreImage media={block.image} alt={block.headline} priority ratio="portrait" sizes="(min-width: 1024px) 40vw, 90vw" />
              </div>
              {/* floating authenticity chip */}
              <m.div
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: easeOutSoft, delay: 0.6 }}
                className="glass absolute -left-4 bottom-8 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-soft ring-1 ring-line sm:-left-8"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-celadon-deep text-white">✓</span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-ink">100% Authentic</p>
                  <p className="font-mono text-[11px] text-grey">Verifiable batch code</p>
                </div>
              </m.div>
            </m.div>
          )}
        </div>
      </Container>
    </section>
  )
}
