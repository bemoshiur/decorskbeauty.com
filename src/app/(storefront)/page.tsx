/*
  Phase 0 landing. Intentionally Payload-free: the storefront never calls the Local API
  or imports collections directly (BUILD_PROMPT §3). Real data access lands in Phase 1
  through src/lib/commerce/**. This page exists to prove tokens, fonts and budgets.
*/
export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-grey">Banani · Dhaka</p>
        <h1 className="text-4xl font-semibold text-celadon-deep">Decor&rsquo;s K-Beauty</h1>
        <p className="text-lg text-ink">100% Authentic Korean Skincare &amp; Haircare</p>
      </header>

      {/* A nod to the signature authenticity slip (§16.4) — evidential voice in Martian Mono */}
      <section
        aria-label="Batch verification sample"
        className="border border-grey/50 bg-white/40 p-5 font-mono text-sm text-ink"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="uppercase tracking-widest text-celadon-deep">Batch Verify</span>
          <span
            aria-hidden
            className="inline-block h-3 w-3 rounded-full bg-seal"
            title="authenticity seal"
          />
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
          <dt className="text-grey">LOT</dt>
          <dd>SNP24K0917B</dd>
          <dt className="text-grey">MFG</dt>
          <dd>2024-09-17</dd>
          <dt className="text-grey">EXP</dt>
          <dd>2027-09-16</dd>
        </dl>
      </section>

      <footer className="font-mono text-xs text-grey">
        <p>Foundation build · Phase 0</p>
        <p>+8801712113032 · decorskbeauty.com</p>
      </footer>
    </div>
  )
}
