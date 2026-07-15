/** Price with slashed MRP + a rationed "−N%" seal badge (redesign). Martian Mono, ৳ prefix (§16.2). */
export function PriceTag({
  mrp,
  sale,
  size = 'md',
  className = '',
}: {
  mrp: number | null | undefined
  sale?: number | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  if (mrp == null) return null
  const fmt = (n: number) => `৳${n.toLocaleString('en-US')}`
  const onSale = sale != null && sale < mrp
  const price = onSale ? sale! : mrp
  const off = onSale ? Math.round(((mrp - sale!) / mrp) * 100) : 0
  const priceSize = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-lg'

  return (
    <div className={`flex flex-wrap items-baseline gap-2 font-mono tabular-nums ${className}`}>
      <span className={`${priceSize} font-semibold text-celadon-deep`}>{fmt(price)}</span>
      {onSale && (
        <>
          <s className="text-sm text-grey">{fmt(mrp)}</s>
          <span className="rounded-[3px] bg-seal px-1.5 py-0.5 text-[11px] font-semibold text-paper">−{off}%</span>
        </>
      )}
    </div>
  )
}
