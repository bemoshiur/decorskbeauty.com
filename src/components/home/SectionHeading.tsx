import { cn } from '@/lib/cn'
import { Reveal } from '@/components/motion/Reveal'

/** Consistent section heading (eyebrow + display title + optional subtitle), revealed on scroll. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  onDark = false,
  className,
}: {
  eyebrow?: string | null
  title?: string | null
  subtitle?: string | null
  align?: 'left' | 'center'
  onDark?: boolean
  className?: string
}) {
  if (!title && !eyebrow && !subtitle) return null
  return (
    <Reveal
      className={cn(
        'flex flex-col gap-3',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      {eyebrow && (
        <span className={cn('text-xs font-semibold uppercase tracking-[0.18em]', onDark ? 'text-celadon-soft' : 'text-celadon-deep')}>
          {eyebrow}
        </span>
      )}
      {title && (
        <h2 className={cn('font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl', onDark ? 'text-paper' : 'text-ink')}>
          {title}
        </h2>
      )}
      {subtitle && (
        <p className={cn('max-w-2xl text-base leading-relaxed', onDark ? 'text-paper/70' : 'text-ink-soft')}>{subtitle}</p>
      )}
    </Reveal>
  )
}
