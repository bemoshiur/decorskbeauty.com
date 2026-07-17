import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'

const SIZE = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' } as const

/** Read-only star rating. Uses the rationed `honey` accent for fill (stars are merchandising). */
export function ReviewStars({
  rating,
  size = 'sm',
  className,
}: {
  rating: number
  size?: keyof typeof SIZE
  className?: string
}) {
  const rounded = Math.round(rating)
  return (
    <span
      className={cn('inline-flex items-center gap-0.5', className)}
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(SIZE[size], i <= rounded ? 'fill-honey text-honey' : 'fill-transparent text-line')}
          aria-hidden
        />
      ))}
    </span>
  )
}
