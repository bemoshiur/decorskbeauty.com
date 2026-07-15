/** Prices are evidential — Martian Mono, Latin digits, ৳ prefix (§16.2). */
export function Price({
  amount,
  sale,
  className = '',
}: {
  amount: number | null | undefined
  sale?: number | null
  className?: string
}) {
  if (amount == null) return null
  const fmt = (n: number) => `৳${n.toLocaleString('en-US')}`
  if (sale != null && sale < amount) {
    return (
      <span className={`font-mono tabular-nums ${className}`}>
        <span className="text-seal">{fmt(sale)}</span>{' '}
        <s className="text-grey">{fmt(amount)}</s>
      </span>
    )
  }
  return <span className={`font-mono tabular-nums ${className}`}>{fmt(amount)}</span>
}
