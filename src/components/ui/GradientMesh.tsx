import { cn } from '@/lib/cn'

/**
 * Decorative aurora blobs layer for hero / feature panels. Pure CSS (drift keyframe is disabled under
 * prefers-reduced-motion via globals.css). Purely presentational, so aria-hidden. Place inside a
 * `relative isolate` parent; sits behind content (-z-10).
 */
export function GradientMesh({ className, animate = true }: { className?: string; animate?: boolean }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}>
      <div
        className={cn(
          'absolute -left-24 -top-28 h-[26rem] w-[26rem] rounded-full opacity-70 blur-3xl',
          'bg-[radial-gradient(circle_at_center,var(--color-celadon),transparent_65%)]',
          animate && 'animate-drift',
        )}
      />
      <div
        className={cn(
          'absolute -right-20 top-8 h-[22rem] w-[22rem] rounded-full opacity-60 blur-3xl',
          'bg-[radial-gradient(circle_at_center,var(--color-sky),transparent_65%)]',
          animate && 'animate-drift',
        )}
        style={{ animationDelay: '-6s' }}
      />
      <div
        className={cn(
          'absolute bottom-[-6rem] left-1/3 h-[24rem] w-[24rem] rounded-full opacity-55 blur-3xl',
          'bg-[radial-gradient(circle_at_center,var(--color-apricot),transparent_65%)]',
          animate && 'animate-drift',
        )}
        style={{ animationDelay: '-11s' }}
      />
    </div>
  )
}
