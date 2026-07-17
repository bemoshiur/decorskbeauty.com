import type { ReactNode, ElementType } from 'react'
import { cn } from '@/lib/cn'

/** Centered max-width content column with responsive gutters. */
export function Container({
  children,
  className,
  as,
  size = 'default',
}: {
  children: ReactNode
  className?: string
  as?: ElementType
  size?: 'default' | 'wide' | 'narrow'
}) {
  const Tag = (as ?? 'div') as ElementType
  const max = size === 'wide' ? 'max-w-[88rem]' : size === 'narrow' ? 'max-w-3xl' : 'max-w-7xl'
  return <Tag className={cn('mx-auto w-full px-5 sm:px-6 lg:px-8', max, className)}>{children}</Tag>
}
