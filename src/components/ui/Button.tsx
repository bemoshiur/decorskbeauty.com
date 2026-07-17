import type { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'ink' | 'seal'
type Size = 'sm' | 'md' | 'lg'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight ' +
  'transition-[transform,box-shadow,background-color,color] duration-200 ease-out-soft ' +
  'active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap'

const VARIANT: Record<Variant, string> = {
  // Deep celadon gradient — the primary conversion action.
  primary: 'grad-cta text-white shadow-lift hover:shadow-glow hover:-translate-y-0.5',
  secondary: 'bg-cloud text-celadon-ink ring-1 ring-line hover:ring-celadon hover:bg-white',
  ghost: 'text-celadon-ink hover:bg-mist',
  ink: 'bg-ink text-paper hover:bg-celadon-ink hover:-translate-y-0.5',
  seal: 'bg-seal text-white hover:brightness-95', // rationed
}

const SIZE: Record<Size, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-6 text-[0.95rem]',
  lg: 'h-14 px-8 text-base',
}

type CommonProps = { variant?: Variant; size?: Size; className?: string; children: ReactNode }

type ButtonAsButton = CommonProps & { href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>
type ButtonAsLink = CommonProps & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

/** Primary CTA button. Pass `href` to render a Next <Link>; otherwise a real <button>. 44px+ tap target. */
export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = 'primary', size = 'md', className, children } = props
  const classes = cn(BASE, VARIANT[variant], SIZE[size], className)

  if ('href' in props && props.href !== undefined) {
    const { href, variant: _v, size: _s, className: _c, children: _ch, ...rest } = props
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    )
  }
  const { variant: _v, size: _s, className: _c, children: _ch, href: _h, ...rest } = props as ButtonAsButton
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}
