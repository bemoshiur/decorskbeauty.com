const ITEMS = [
  { icon: '✓', label: '100% Authentic', sub: 'Verifiable batch code' },
  { icon: '৳', label: 'Cash on Delivery', sub: 'Pay when it arrives' },
  { icon: '⚡', label: '2–3 Day Delivery', sub: 'Across Dhaka' },
  { icon: '⟳', label: 'Easy Returns', sub: 'Damaged or wrong item' },
]

/** The trust strip (redesign, ghorerbazar pattern) — the authenticity + COD promises that convert BD buyers. */
export function TrustRow({ className = '' }: { className?: string }) {
  return (
    <ul className={`grid grid-cols-2 gap-px overflow-hidden rounded-[6px] border border-grey/25 bg-grey/20 sm:grid-cols-4 ${className}`}>
      {ITEMS.map((it) => (
        <li key={it.label} className="flex items-center gap-2.5 bg-paper px-3 py-3">
          <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-celadon/15 font-mono text-celadon-deep">{it.icon}</span>
          <span className="leading-tight">
            <span className="block text-xs font-semibold text-ink">{it.label}</span>
            <span className="block text-[11px] text-grey">{it.sub}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
