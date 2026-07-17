import { Container } from '@/components/ui/Container'
import { Skeleton, ProductCardSkeleton } from '@/components/ui/Skeleton'

/** Branded route-loading skeleton for the storefront — keeps navigation from flashing blank (CLS-safe). */
export default function Loading() {
  return (
    <Container className="py-10">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-56 rounded-lg" />
        <Skeleton className="h-4 w-28 rounded" />
      </div>
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </Container>
  )
}
