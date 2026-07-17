import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Container } from './Container'

type SectionProps = {
  children: ReactNode
  className?: string
  /** decorative background treatment */
  surface?: 'paper' | 'cloud' | 'mist' | 'mesh-hero' | 'mesh-mint' | 'mesh-bloom' | 'ink'
  /** vertical rhythm */
  spacing?: 'sm' | 'md' | 'lg'
  /** wrap children in a Container (default true) */
  container?: boolean
  containerSize?: 'default' | 'wide' | 'narrow'
  id?: string
}

const SURFACE: Record<NonNullable<SectionProps['surface']>, string> = {
  paper: 'bg-paper text-ink',
  cloud: 'bg-cloud text-ink',
  mist: 'bg-mist text-ink',
  ink: 'bg-celadon-ink text-paper',
  'mesh-hero': 'mesh-hero text-ink',
  'mesh-mint': 'mesh-mint text-ink',
  'mesh-bloom': 'mesh-bloom text-ink',
}

const SPACING = { sm: 'py-12 sm:py-16', md: 'py-16 sm:py-24', lg: 'py-20 sm:py-32' }

/** A full-bleed page section with an optional gradient surface and consistent vertical rhythm. */
export function Section({
  children,
  className,
  surface = 'paper',
  spacing = 'md',
  container = true,
  containerSize = 'default',
  id,
}: SectionProps) {
  return (
    <section id={id} className={cn('relative isolate', SURFACE[surface], SPACING[spacing], className)}>
      {container ? <Container size={containerSize}>{children}</Container> : children}
    </section>
  )
}
