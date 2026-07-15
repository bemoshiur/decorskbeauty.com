export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-grey/30">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-2">
        <div>
          <p className="text-base font-semibold text-celadon-deep">Decor&rsquo;s K-Beauty</p>
          <p className="mt-1 max-w-sm text-sm text-ink">
            100% authentic Korean skincare &amp; haircare. Every unit ships from a tracked import lot.
          </p>
        </div>
        <div className="font-mono text-xs leading-relaxed text-grey sm:text-right">
          <p>Flat B5, House 32-34, Road 7, Block C</p>
          <p>Banani, Dhaka 1212</p>
          <p className="mt-2 text-ink">+8801712113032</p>
        </div>
      </div>
    </footer>
  )
}
