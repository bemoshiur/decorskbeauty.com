import { cn } from '@/lib/cn'

/** Shimmer skeleton block. The sweep is disabled under prefers-reduced-motion (globals.css). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-mist', className)} aria-hidden>
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
        style={{ animation: 'shimmer 1.6s ease-in-out infinite' }}
      />
    </div>
  )
}

/** A product-card placeholder used in listing skeletons. */
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card bg-cloud ring-1 ring-line/70">
      <Skeleton className="aspect-square rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-3 w-16 rounded" />
        <Skeleton className="h-4 w-11/12 rounded" />
        <Skeleton className="mt-2 h-5 w-20 rounded" />
      </div>
    </div>
  )
}
