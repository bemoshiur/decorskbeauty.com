# CLAUDE.md — Decor's K-Beauty

Read this first, every session. Then read `JOURNEY.md` (tail 100 lines) to see where the last session stopped.
`BUILD_PROMPT.md` is the spec. It wins over anything you infer.

---

## What this is

E-commerce for **Decor's K-Beauty**, Korean skincare and haircare, Banani, Dhaka. Bengali-first, bilingual. Payload 3 + Next.js + Neon + Vercel. COD and EPS. Pathao and Steadfast. Full double-entry accounting.

Owner: Moshiur (Public Pulse Agency). Same stack family as TenderPulse and Event Pulse.

---

## Non-negotiables

Break any of these and the build is wrong, no matter how good the code is.

1. **`variants.sku` is the identity spine.** Same byte-identical string in the catalog feed `id`, Pixel `content_ids`, CAPI `contents[].id`, and Google feed `id`. Drift here breaks Advantage+ silently.
2. **`orders.codAmount` is what goes to the courier as `amount_to_collect`.** Never `grandTotal`. If an advance was paid and you send the full amount, the customer pays twice.
3. **`computeCheckoutTerms(cart, zone)` is the only place delivery/advance/COD numbers exist.** No magic numbers anywhere else.
4. **Stock changes only through `stockMovements`.** Never write `qtyAvailable` directly.
5. **Every financial event posts a balanced journal.** No adjustment fields on orders.
6. **Pre-order money is a liability (2030), not revenue.** Releases to 4010 on ship only.
7. **EPS: always verify via API No.3.** Never update the DB from redirect query params.
8. **`fbp`/`fbc` come from `orders.attribution` (the DB), not cookies.** Safari killed the cookie before the purchase.
9. **Purchase fires at order confirmation, not form submit.** `order_delivered` fires at delivery.
10. **Product titles are always English.** Everything else is bilingual with Bengali as default.
11. **No surface is English-only.** Errors, validation, SMS, invoice, empty states, all of it.
12. **`AggregateRating` renders only with real approved reviews.** Never seed reviews.
13. **Storefront never imports from `src/collections/**` or calls `payload.find()` directly.** It goes through `src/lib/commerce/**`.

---

## Locked facts

| | |
| --- | --- |
| Domain | `decorskbeauty.com` |
| Address | Flat B5, House 32-34, Road 7, Block C, Banani, Dhaka 1212 |
| Phone | 01712-113032 / `+8801712113032` |
| Delivery | Dhaka City ৳80 · Dhaka Sub ৳110 · Outside ৳140 |
| Advance | Outside Dhaka ৳200 · Order >৳5,000 → 30% · Any pre-order line → 100% · **take the higher, never both** |
| Free shipping | Subtotal ≥ ৳4,999, measured after discount, before delivery |
| Order number | `DKB-YYMM-#####` |
| Locales | `bn` at `/` (default), `en` at `/en`, `x-default` → bn |
| Catalog | 50 SKUs now, must hold 1,500 |

---

## Design tokens

**Source of truth is `src/app/(storefront)/globals.css` `@theme`** (evolved 2026-07-17, owner-directed:
premium, animated, "Webflow-template" look with tasteful colour + gradients — see
`docs/superpowers/plans/2026-07-17-premium-redesign.md`). This SUPERSEDES the old restrained 6-colour
set — do NOT "fix" the storefront back to the neutral/6-colour palette; that is a regression.

Still true: celadon greens are the brand anchor, and **no pastel pink** (the fake-seller default).
The evolved system keeps celadon/paper/ink and ADDS rationed warm/cool accents used only in gradients
and merchandising badges:

```
neutrals : --paper #F2F4F1  --cloud #FBFCFB  --mist #E9EEE9  --ink #14181A  --ink-soft #37413D  --grey #636863  --line #DDE4DE
brand    : --celadon #7FA893  --celadon-soft #A9C6B6  --celadon-deep #2F5D4A  --celadon-ink #1E3D30
accents  : --apricot #F5C9A6  --rose-clay #E39B8C  --lilac #CFC9F0  --sky #A9D8E4  --honey #E9B949   (gradients/badges only)
alert    : --seal #C0362C   (rationed: authenticity seal + expiry ONLY)
gradients: .mesh-hero / .mesh-mint / .mesh-bloom (aurora), .grad-cta, .text-gradient   (utilities in globals.css)
```

Type: **Fraunces** (`--font-display`, editorial serif → headlines/section titles) + **Geist Sans**
(`--font-sans`, UI/body) + **Geist Mono** (`--font-mono`, prices/SKU/batch/tracking). (The old Anek +
Martian Mono spec is retired; English-only build.)

Motion: **framer-motion** via `MotionProvider` (LazyMotion) + the `Reveal`/`RevealGroup` scroll-reveal
islands — every animation honours `prefers-reduced-motion`. Reuse the primitives in
`src/components/ui/**`, `src/components/motion/**`, `src/components/shop/**`; the homepage is
admin-managed blocks (`src/components/home/blocks/**`) rendered by `BlockRenderer`.

Signature component: **the authenticity proof** — a homepage "why 100% authentic" section + a PDP
authenticity assurance line (verify link). Real batch/lot data is NOT shown publicly (owner call);
show the verify CTA, keep the mono-slip visual as generic evidence. Proof before persuasion.

---

## Vercel + Payload constraints

- Neon **pooled** connection string only (`-pooler` host).
- `push: false` in production. Migrations only.
- Long jobs (PO receive >200 lines, feed generation, period close, bulk courier push) run in cron routes with raised `maxDuration`, never in an admin request cycle.
- Keep the storefront decoupled from Payload's Local API so splitting Payload onto a persistent host later is a config change, not a rewrite.

---

## Session protocol

1. `git pull`, read `JOURNEY.md` tail.
2. State which phase you are in (`BUILD_PROMPT.md` §19) and the one thing you are shipping this session.
3. Build. Small commits, conventional messages.
4. Before claiming done: `pnpm tsc --noEmit`, `pnpm test`, `pnpm build`, Lighthouse CI. All green or it is not done.
5. Append a JOURNEY entry.
6. If you touched anything in the Non-negotiables list, say so explicitly in the entry.

### JOURNEY entry format

```md
## 2026-07-15 · Phase 3 · Checkout terms
**Shipped:** computeCheckoutTerms + 22 unit tests covering every §1.1 branch.
**Decisions:** Rule 1 vs rule 3 resolved as max(), not sum. Test asserts a ৳6,000 outside-Dhaka
  order takes ৳1,800 (30%), not ৳2,000.
**Open:** Pathao area IDs for Savar look wrong in the cached list, needs a refresh run.
**Next:** OTP flow.
```

---

## Ask, do not decide

- VAT rate and the correct Mushak form. Tax question, not an engineering one. `vatRatePercent` stays `0` with an admin banner until Moshiur confirms with the consultant.
- Gennet's real API shape. The adapter interface is built; `providers/gennet.ts` is a stub until the panel docs arrive. Alpha SMS (`api.sms.net.bd`) is the drop-in fallback.
- Adding `fraudbd` (paid third party). Off by default.
- Splitting Payload off Vercel if admin latency bites past ~800 SKUs.
- Any request to seed reviews, fake ratings, or fire Purchase on form submit. The answer is no. Explain why.

---

## Things that will bite you

| Trap | Reality |
| --- | --- |
| Facebook in-app browser | The EPS redirect chain breaks in the FB webview. Resume token + `intent://` (Android) / `x-safari-https://` (iOS) interstitial. Cart rehydrates from token + DB, **never from cookies**. Test on a real phone in the real app; the emulator lies. |
| Safari ITP | 7-day cap kills `_fbp`. Capture `fbclid` server-side at landing, build `fbc` as `fb.1.{unixMs}.{fbclid}`, persist on `carts.attribution` → `orders.attribution`. |
| EPS status field | Aliases: `Status`, `transactionStatus`, `status`, `data.transactionStatus`, `data.status`. Mixed casing. The V5 PDF is incomplete. Handle all variants per the skill. |
| EPS reloads | Success handler must be idempotent. Bad connections mean constant reloads. Key on `merchantTransactionId`. |
| Pathao token | Long-lived. Cache in Neon, refresh by cron. Do not re-issue per request. |
| Steadfast fraud check | No clean public API. Community packages scrape the merchant panel. Do not do that. Pathao's phone success-rate endpoint is the real one. |
| Courier webhooks | They get dropped in BD. The 30-minute reconciling cron is not optional. |
| Bengali SMS | Unicode = 70 chars per segment, not 160. A 3-segment OTP costs 3×. Length-check templates at build time. |
| Bengali fonts | 200KB+ unsubsetted. Subset to U+0980-09FF with `pyftsubset`. Target <60KB. |
| Vercel image cost | 7,500 images × per-viewport transforms will hurt. Pre-generate the responsive set once on upload, serve with `unoptimized`. |
| Bengali search in Postgres | Stemming is weak. `simple` config + `pg_trgm` + a transliteration column + a hand-curated synonym map for the top 200 terms. |
| Payload arrays at scale | `variants` is a separate collection, not an array on `products`. At 1,500 × size × shade an array will not survive. |
| Price snapshots | `orders.items` stores `titleSnapshot`, `skuSnapshot`, `unitPriceSnapshot`, `landedCostSnapshot`. Last month's invoice must not change when this month's price does. |

---

## Related work in the estate

Patterns worth reusing rather than reinventing:

- **EPS integration** → the `eps-payment-gateway` skill, `scripts/nextjs/`. Follow it exactly.
- **In-app browser guard** → the same problem was solved on ClientFinder BD. Same shape here, plus the resume token.
- **BN-first bilingual + SEO/AEO** → TenderPulse (BN default, `x-default` → bn, IndexNow, `llms.txt`, `DefinedTerm`, FAQPage, quality gates).
- **Next.js + Neon + serverless** → TenderPulse, Event Pulse. Note this one is Vercel/Payload, not SST/Lambda; the pooling advice differs.
