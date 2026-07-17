import { Container } from '@/components/ui/Container'
import { Skeleton } from '@/components/ui/Skeleton'

/** PDP route-loading skeleton (mirrors the gallery + buy-panel two-column layout). */
export default function ProductLoading() {
  return (
    <Container className="grid gap-10 py-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
      <Skeleton className="aspect-square w-full rounded-feature" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-9 w-4/5 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded" />
        <Skeleton className="mt-2 h-64 w-full rounded-card" />
        <Skeleton className="h-10 w-full rounded-card" />
      </div>
    </Container>
  )
}
