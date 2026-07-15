import Link from 'next/link'

export type LotStamp = {
  lotCode?: string | null
  mfgDate?: string | null
  expDate?: string | null
  importDate?: string | null
  poRef?: string | null
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <>
    <dt className="text-grey">{k}</dt>
    <dd className="text-ink">{v}</dd>
  </>
)

const Seal = () => (
  <span
    aria-hidden
    className="slip-seal grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-seal font-mono text-[9px] font-semibold uppercase leading-none tracking-tight text-seal"
  >
    Auth
  </span>
)

/**
 * The signature (§16.4) — proof before persuasion. Real lot data (LOT/MFG/EXP/import) is wired
 * in Phase 2 from stockLots via FEFO. Until then it shows the honest promise — never a fake code.
 */
export function AuthenticitySlip({ lot, verifyHref }: { lot?: LotStamp; verifyHref?: string }) {
  const hasLot = Boolean(lot?.lotCode)

  return (
    <section
      aria-label="Authenticity"
      className="border border-celadon-deep/40 bg-white/50 p-4 font-mono text-[13px]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-celadon-deep">Batch verification</p>
          <p className="mt-0.5 text-[11px] normal-case text-grey">Tracked import lot · not a claim, a receipt</p>
        </div>
        <Seal />
      </div>

      <hr className="my-3 border-grey/30" />

      {hasLot ? (
        <dl className="grid grid-cols-[4.5rem_1fr] gap-x-4 gap-y-1">
          <Row k="LOT" v={lot!.lotCode!} />
          {lot?.mfgDate && <Row k="MFG" v={lot.mfgDate} />}
          {lot?.expDate && <Row k="EXP" v={lot.expDate} />}
          {(lot?.importDate || lot?.poRef) && (
            <Row k="IMPORT" v={[lot?.importDate, lot?.poRef].filter(Boolean).join('  ·  ')} />
          )}
        </dl>
      ) : (
        <p className="text-[12px] leading-relaxed text-ink">
          Every unit ships from a tracked import lot. The batch code, manufacture and expiry dates are
          printed on your parcel — and verifiable here.
        </p>
      )}

      {hasLot && verifyHref && (
        <>
          <hr className="my-3 border-grey/30" />
          <Link href={verifyHref} className="inline-block text-celadon-deep underline-offset-2 hover:underline">
            Verify this batch &rarr;
          </Link>
        </>
      )}
    </section>
  )
}
