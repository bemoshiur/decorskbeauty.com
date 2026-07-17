# JOURNEY — Decor's K-Beauty

Append-only build log. Newest at the bottom. Format per CLAUDE.md.

---

## 2026-07-15 · Phase 0 · Foundation

**Shipped:**
- Scaffolded with `create-payload-app` (blank template) → **Payload 3.86.0 + Next 16.2.6 + React 19.2.6**, `@payloadcms/db-vercel-postgres` adapter. Spec files (BUILD_PROMPT.md, CLAUDE.md, env.example) preserved.
- Neon **pooled** connection wired via `DATABASE_URL`; `push: false` in production, push allowed in dev/test.
- Vercel Blob storage (`@payloadcms/storage-vercel-blob`), enabled only when `BLOB_READ_WRITE_TOKEN` is present — falls back to local disk for now.
- Repo skeleton per §3: `(storefront)` route group, `src/lib/{commerce,inventory,accounting,integrations,seo,browser}`, `src/globals`.
- **§3 storefront↔collections import boundary enforced by ESLint** (verified it fires on `payload` + `@/collections/*` imports). Replaced the scaffold's broken FlatCompat eslint config with a direct-plugin flat config.
- Tailwind v4 + design tokens from §16.2 (the six colours, 4pt grid, control radius). No colour outside the set.
- Self-hosted fonts via `next/font/local`: **Anek Latin (45KB) + Martian Mono (24KB) = 68KB**, under the 120KB budget.
- Minimal English landing (Payload-free, respects the boundary) + admin at `/admin`. Vitest integration test boots Payload against Neon.
- CI (`typecheck` → `lint` → `test` → `build` → Lighthouse) + `lighthouserc.json` budgets (LCP<2s, CLS<0.05).

**Decisions:**
- **i18n DROPPED — single-locale English, owner-approved (AskUserQuestion, 2026-07-15).** This reverses **non-negotiable #10** (trivially satisfied now) and **#11** ("no surface is English-only"), and voids **acceptance #30**. Also drops §5, Anek Bangla + the Bengali subset, `meta.bn.xml`, Bengali SMS/email, Bengali digits, and the §14.3 Bengali AEO surface. The three core pillars (§0: provable authenticity, FB in-app-browser speed, CAPI durability) are unaffected. **Reversing this later is a rewrite, not a flag flip.** See memory [[english-only-override]].
- Config reads `DATABASE_URL` (spec contract), not the scaffold's `POSTGRES_URL`.
- `pnpm test` = integration only for Phase 0; Playwright e2e deferred to Phase 4 (the real browser gates).
- **`font-display: optional` + `preload: false`, not `swap` (§15.2).** Two spec budgets conflicted: §15.2 wants `swap`, but the hard LCP<2s budget (§15.1) failed at ~2.6s because Lighthouse's Lantern model ties the LCP heading's paint to the simulated download of the *preloaded* web font. With `optional` + no preload, the fallback (size-adjusted, CLS-safe) carries first paint and the brand font applies from cache on the next view → LCP drops to ~FCP. Fonts stay self-hosted and under budget. Flag: this affects the real PDP too — the LCP element (product title/hero) must not depend on a preloaded web font.
- Driving `create-payload-app`'s TUI headlessly required a PTY via `expect` **with a terminal window size set** (`stty_init`) — without dimensions clack silently drops all keystrokes.

**Open:**
- No `BLOB_READ_WRITE_TOKEN` yet → media on local disk until provided.
- **GenNet base URL still unknown** — have real PPA creds + full endpoint shapes from the V3.1 API doc (`/api/v3/send-sms[/bulk|/dynamic|/status]`, `/balance`, csms_id dedup, Unicode→BN), but the `<domain>` base must come from the GenNet panel. Captured in memory [[gennet-sms-api]].
- **No Vercel deploy this session** (no Vercel creds) → the §19 "deploy to a Vercel preview" per-phase gate is deferred. CI needs `DATABASE_URL` + `PAYLOAD_SECRET` set as GitHub Actions secrets.
- Repo is **public** — GenNet PDF + `Products/` (Phase 1 assets) + all env are gitignored.
- Deferred spec question **C** (§1.1: is ">৳5,000" measured on subtotal or grandTotal?) still needs the owner before Phase 3.

**Non-negotiables touched:** #10 and #11 (see the i18n decision above — explicit, owner-approved).

**Next:** Phase 1 — Catalog (brands, categories, products, variants, ingredients, media pipeline §15.4, ISR + revalidateTag), enter the launch SKUs, PDP + PLP. New session (one phase per session).

---

## 2026-07-15 · Phase 1 · Catalog

**Shipped:**
- Five catalog collections (§4.1, English-only): `brands`, `categories`, `ingredients`, `products` (drafts), `variants`. `variants.sku` indexed + unique.
- Media pipeline (§15.4): on-upload responsive **AVIF+WebP at 400/800/1200** (one transform per image) + base64 blur placeholder.
- `lib/commerce` cached data-access (`unstable_cache` + catalog tags + 5-min TTL) with afterChange/afterDelete revalidation; storefront reads ONLY through it (§3, lint-enforced).
- PDP (`/products/[slug]`, §6.1 order) + home PLP grid + the **authenticity slip**, `ResponsiveImage` (pre-gen set, priority hero, blur), Martian Mono prices, seal stamp motion.
- Seeded the launch catalog: **9 brands, 6 categories, 10 ingredients, 12 products + 12 variants + 12 images.**

**Decisions:**
- **12 real SKUs** (the owner's brief), not the spec's "50" estimate; architecture still holds 1,500.
- SKU = brand-abbrev + merchant code (e.g. `CRX-921`); merchant code also stored as `barcode`. Shelf prices taken from the product photos.
- Product #10 is **RYO** (per packaging), not "RAY" (brief typo).
- Authenticity slip shows the **honest promise** until Phase 2 lot data — never a fabricated batch code.
- **`experimental.inlineCss`** (Next) removes the render-blocking CSS round-trip so the web-font text LCP element paints fast on throttled 4G. Cut LCP from ~2.6s → ~1.3s.
- Category route `/c/[...category]`, search (§6.4), routine builder (§6.3), reviews — deferred; the home grid serves as the PLP for now (categories are seeded + assigned).

**Non-negotiables touched:** #1 (`variants.sku` established as the indexed/unique identity spine), #13 (storefront reads only via `lib/commerce`, enforced by ESLint), #10 (titles English).

**Open:**
- Product photos have a **purple studio background** (§15.4 wants white/consistent) — usable now; better shots recommended before scaling the catalog.
- The dedicated category PLP route + filters (§6.5), search, routine builder, reviews remain for later.
- CI still needs `DATABASE_URL` + `PAYLOAD_SECRET` secrets (from Phase 0) or it stays red at the test step.

**Verified:** `typecheck`, `test` (Neon), `build` (17 pages prerendered incl. 12 PDPs), `lint` (0 errors), Lighthouse — home + PDP **LCP ~1.3s, CLS 0, perf ~1.0** (devtools throttling).

**Next:** Phase 2 — Inventory (suppliers, POs, landed cost, `stockLots`, `stockMovements`, FEFO allocator, expiry policy) and wire the authenticity slip + PDP EXP to the real FEFO lot, plus `/verify`.

---

## 2026-07-15 · Phase 2 · Inventory

**Shipped:**
- Inventory collections (§4.2): `suppliers`, `purchaseOrders`, `stockLots` (authenticity spine), `stockMovements` (immutable, append-only).
- **Landed cost** (§4.2) as a pure, tested function (byValue / byWeight / byQty). PO `status → received` hook computes it and creates a lot + `receipt` movement per line.
- **Movement → quantity hook**: `stockLots.qtyAvailable` and `variants.availableQty` are maintained ONLY through movements (non-negotiable #4).
- **FEFO allocator** (§10.1), pure + tested: earliest EXP, tiebreak earliest receipt, skips quarantined/expired and the <3-month near-expiry window (§10.3).
- PDP now shows the **FEFO lot's EXP** (§10.2); the **authenticity slip** is wired to the real lot (LOT/MFG/EXP/import); **`/verify`** (§6.2) resolves a batch code → product + import docs, with an honest not-found + WhatsApp fallback (never a faked pass).
- Seeded a PO receive → **12 real lots** for the catalog.

**Decisions:**
- Accounting journals for receipts stay in **Phase 7** — inventory and accounting deliberately decoupled.
- vitest `fileParallelism: false` so two Payload inits don't race on `CREATE TYPE` for new enums.
- The movement hook threads `req` so it reads inside the receive transaction (the lot exists mid-transaction).
- Hiding `landedCostPerUnit` from packer/support is deferred to **Phase 9** RBAC.

**Non-negotiables touched:** **#4** (availableQty changes only via `stockMovements` — proven by an integration test: receipt → qtyAvailable=20), authenticity honesty (slip + `/verify` show real lot data or an honest miss, never a fake code). #1 unchanged.

**Open:**
- Near-expiry **status cron** (§10.3 daily transitions) + `/c/clearance` — later. FEFO eligibility is computed at query time, so allocation is correct now regardless of lot `status`.
- Import docs (BL / invoice / customs release) aren't uploaded on the seeded lots yet — the `/verify` docs section renders when they're present.
- `reserve` / `ship` / `returnRestock` movement flow arrives with cart (Phase 3) + fulfilment (Phase 5).

**Verified:** typecheck, **16 tests** (landed cost = 135; receipt → `qtyAvailable` = 20 via #4; FEFO order/tiebreak/skip; idempotent receive), lint, build, Lighthouse (budgets hold); PDP EXP + `/verify` confirmed against real seeded lots (`CRX-921-2506` → Verified).

**Next:** Phase 3 — Cart + checkout: `computeCheckoutTerms` with a unit test for **every** §1.1 branch (the hard gate), OTP, Pathao location cache, guest checkout. **Blocked on spec question C** (is ">৳5,000 → 30%" measured on subtotal or grandTotal?) — need the owner before finalizing the terms function.

---

## 2026-07-15 · Phase 3 · Cart + checkout

**Shipped:**
- **`computeCheckoutTerms` (§1.1)** — the single source of delivery/advance/COD (non-negotiable #3). **18 unit tests cover every branch** (zones, free-shipping boundary, >5,000, pre-order, mixed, boundaries) — the hard gate.
- SMS provider interface + **console / gennet / alpha** adapters (§17.3). GenNet base URL still unknown → dev uses console.
- **OTP** (§17.1): `otpChallenges` collection, `/api/otp/request` + `/verify`, hashed codes, 5-min expiry / 3 attempts / 15-min lock, rate limits (3/hr phone, 10/hr IP), signed HttpOnly phone-token cookie. Verified end-to-end.
- `carts` collection (§4.3) + cookie-keyed cart lib + **Add to cart** on the PDP.
- **One-page guest checkout**: cart + delivery-zone selector with **live `computeCheckoutTerms`** + phone/OTP. (Order placement + EPS = Phase 4; "Place order" is disabled pending it.)

**Decisions:**
- **">৳5,000 → 30%" is measured on grandTotal** incl. delivery (owner, question C).
- **Pathao location cache + searchable combobox DEFERRED** — needs Pathao API creds; free-text address for now (§7's fallback field).
- `customers` collection deferred to Phase 4 (created at order placement); the cart holds `phone` only for now.
- **Security (CRITICAL, fixed):** `stockLots` was publicly readable via REST → leaked `landedCostPerUnit` (COGS). Now staff-only; the public `/verify` + PDP read server-side with `overrideAccess` and project only safe fields.

**Non-negotiables touched:** **#3** — `computeCheckoutTerms` is the only place delivery/advance/COD numbers exist (18 tests + no magic numbers elsewhere).

**Open:**
- **Order placement + EPS payment + stock reservation = Phase 4.**
- Pathao location cache/combobox needs Pathao creds.
- `/verify` exposing scanned import docs publicly — flagged for the owner (§6.2 says show them, but a commercial invoice can reveal supplier/cost).
- Abandoned-cart SMS, coupons, wishlist, `/checkout` Lighthouse (dynamic, needs a seeded cart) — later.

**Verified:** typecheck, **34 tests** (incl. 18 §1.1 branches), lint (0 errors, boundary holds), build, OTP round-trip (request → wrong → correct → cookie → rate-limit 429), checkout renders.

**Next:** Phase 4 — Payments. **Read the `eps-payment-gateway` skill first — do not write EPS from memory.** EPS hosted checkout (GetToken → InitializeEPS → verify via API No.3), `transactions`, idempotent success handler, COD path, in-app-browser interstitial + resume token, and order placement + stock reservation (§10.1).

---

## 2026-07-15 · Phase 4 · Payments

Read the `eps-payment-gateway` skill first (on disk under the skills-plugin cache — not registered with the Skill tool, but its `scripts/nextjs/` is what CLAUDE.md points to). Followed it exactly.

**Shipped:**
- **EPS client** (`src/lib/integrations/eps/client.ts`) per the skill: HMAC-SHA512 `x-hash` with the **per-endpoint** input, token cache, GetToken → InitializeEPS → CheckMerchantTransactionStatus, `normalizeStatus` (all documented + observed aliases), `TXN-<ms>-<hex>` ids. Unit-tested.
- **`orders`** (`DKB-YYMM-#####`, price/cost snapshots, courier/attribution/timeline groups), **`customers`** (phone identity), **`transactions`** (`merchantTransactionId` = idempotency key) collections (§4.3).
- **Order placement** (`lib/commerce/placeOrder`): terms → find/create customer → snapshot items → **FEFO-reserve** ready stock via `reserve` movements (#4) → COD confirm or stage an EPS transaction. `codAmount = grandTotal − advance` (#2).
- **EPS routes** per skill: `/api/checkout/place` (COD / EPS / in-app interstitial) + `/api/payments/eps/{checkout,success,fail,cancel}`. The callback **always verifies via API No.3, never the query params (#7)**, is **idempotent** on the transaction (§8.3), verifies the amount, and releases reservations on fail/cancel.
- **FB in-app-browser guard** (§13.5): detection, signed **resume token**, interstitial (`intent://` Android / `x-safari-` iOS), and `/checkout/pay/[token]` that **rehydrates from the token + DB, never cookies**. Unit-tested.
- The one-page checkout now places orders (guest, OTP-gated).

**Decisions:**
- The **Purchase** event (Phase 6) and **balanced journals** (Phase 7) hook into the confirmation point but aren't fired yet.
- Reservation-expiry cron (§10.1, pending > 60 min) deferred to the cron work; explicit fail/cancel releases immediately.
- Refunds aren't in EPS V5 (skill) → merchant dashboard + a manual journal (Phase 7).

**Non-negotiables touched:** **#2** (codAmount = amount_to_collect, never grandTotal — tested), **#4** (availableQty only via movements — reserve tested), **#7** (verify via API No.3, never redirect params — enforced in the callback), **#9** (the confirmation point where Purchase will fire is set).

**Open — needs you (the two Phase 4 gates I cannot close myself):**
- **EPS credentials** (`EPS_MERCHANT_ID/STORE_ID/USERNAME/PASSWORD/HASH_KEY`) — sandbox for dev, Decor's own for prod. Without them a live payment can't complete; everything else is built and tested. The x-hash is only provable against the live API (skill: "no offline test vector").
- **A real Android phone in the real Facebook app** (§13.5 / acceptance #16) — I can't test on a device. The webview flow is built; it needs a human to sign off.

**Verified (creds-independent):** typecheck, **49 tests** (EPS aliases/hash/mtxn, in-app detection + resume token, COD order + FEFO reservation + outside-advance + pending txn), lint (0 errors), build; routes respond correctly (callback rejects a missing txn id → result error; place is 401 without OTP; pay rejects a bad token).

**Next:** Phase 5 — Fulfilment (order board, fraud check, Pathao push + Steadfast fallback, webhooks + 30-min reconciling cron, invoice + label PDF). Asserts `amount_to_collect === codAmount` (#2). Needs Pathao + Steadfast creds.

---

## 2026-07-15 · Phase 5 · Fulfilment

Owner supplied the Pathao repo (enuenan/pathao-courier) + Steadfast docs mid-phase — confirmed my Aladdin v1 endpoints/fields and the Steadfast shape (§9.2).

**Shipped:**
- **Courier payload builders** (Pathao/Steadfast): `amount_to_collect` / `cod_amount` === `codAmount`, **NEVER grandTotal (#2)** — unit-tested (acceptance #2).
- **Pathao + Steadfast clients** (Aladdin v1 issue-token / orders / order-info / user-success; Steadfast create_order / status_by_cid).
- **Push service**: Pathao primary → **Steadfast fallback** (2× 5xx or no area id), a #2 runtime guard, timeline log, ships the reserved stock.
- **Fraud check** (§7.1/§9.3): interface + pathao(success-rate) / fraudbd / null, decision policy (pure, tested), **2.5s soft timeout → review**, never blocks a sale.
- **Fulfilment status-sync**: handedToCourier (ship movements), delivered (deliveredCount + LTV), returned/RTO (**returnRestock to the ORIGINAL lot at original landed cost, #12**, cancelledCount). `returns` collection.
- **Webhooks** (`/api/courier/{pathao,steadfast}`, secret-required) + **30-min reconciling cron** (`/api/cron/courier-sync`, CRON_SECRET) + `vercel.json`.

**Decisions:**
- Pathao token cached in-process (Neon persistence + cron refresh is the §9.1 production path — noted).
- **Order board = the Payload Orders list** (filterable by fulfilmentStatus). The Kanban visual + custom bulk actions (§11.1) and the **invoice/label PDF (§11.2) are DEFERRED** (a big UI/PDF chunk; the done-criterion #2 is met + tested).
- Delivery journal (Phase 7) + `order_delivered` event (Phase 6) hook into `markDelivered` but aren't fired.
- Steadfast has no clean fraud API — Pathao success-rate is the source (didn't scrape the panel, §9.3).

**Non-negotiables touched:** **#2** (amount_to_collect === codAmount — unit-tested, acceptance #2), **#4** (ship/return via movements), **#12-adjacent** (restock to the original lot at original landed cost — integration-tested).

**Open — needs you:**
- **Pathao + Steadfast credentials** (client_id/secret/username/password/store_id; Api-Key/Secret-Key + webhook token) — no live courier round-trip without them; the mapping + fallback + status logic is built and tested.
- **Invoice + label PDF (§11.2)** and the **Kanban board + custom bulk actions (§11.1)** — deferred.

**Verified:** typecheck, **59 tests** (courier #2 + weight + status-normalize, fraud policy, **RTO restock #12 end-to-end**), lint (0 errors), build; webhooks require their secret (401 otherwise).

**Next:** Phase 6 — Measurement (Pixel + CAPI sharing one event_id, capiQueue + retry cron, attribution persistence #8, meta/meta.bn/google feeds, GA4). Fires Purchase at confirmation (#9). Needs Meta Business Manager + Pixel + CAPI dataset.

---

## 2026-07-15 · Phase 6 · Measurement

Server-side is the source of truth: the Pixel is a hint, CAPI is the record. Both carry **one `event_id`** (= `orderNumber`) so Meta dedups them (§13.3). `meta.bn.xml` is voided by the English-only override — only meta.xml + google.xml ship.

**Shipped:**
- **Catalog feeds** `/api/feed/meta.xml` + `/api/feed/google.xml` (RSS 2.0 + `g:` namespace, ISR 6h). **`<g:id>` === SKU (#1)** — one row per active variant, price `${n.toFixed(2)} BDT`, XML-escaped; `sku_margin_band` from min landed cost (staff signal, coarse). Unit-tested (acceptance #19).
- **Meta CAPI lib** (`integrations/meta/`): `hash.ts` SHA-256 of trim+lowercase (phone → E.164 no `+`); **fbp/fbc/ip/ua passed RAW, never hashed** — unit-tested against `crypto`. `events.ts` `buildFbc = fb.1.{ms}.{fbclid}`, `content_ids === SKU`, `content_type 'product'`. `capi.ts` posts to the Graph API; `test_event_code` only when `NODE_ENV !== 'production'` (#22); no creds → `{ok:false}` (no throw).
- **`capiQueue` collection + `tracking.ts`**: **Purchase enqueued at confirmation (#9)** — COD (placeOrder) + prepay (epsCallback SUCCESS); `order_delivered` at delivery (fulfilment) with the true value (the Purchase↔delivered gap = the RTO rate, §13.4). **user_data (fbp/fbc) read from `order.attribution`, not cookies (#8).** Enqueue is idempotent on `eventId+eventName`.
- **`/api/cron/capi-drain`** (every min, CRON_SECRET header + `safeEqual`): drains pending, exponential backoff `min(3600, 2^attempts·60)`, `failed` at 6 attempts, alerts on depth > 50.
- **`/api/cron/sku-parity`** (daily 03:00): every feed `id` must be a live active SKU — `mismatches` surfaces drift (#1 monitoring).
- **Pixel + GA4** (`Analytics.tsx`, direct `fbq`/`gtag`, no tag manager §13.8) in the storefront layout; **`proxy.ts`** (Next 16's renamed middleware) captures `fbclid` → HttpOnly `dkb_fbc` cookie at landing; `/api/checkout/place` threads `_fbp`/`dkb_fbc`/`fbclid` into `order.attribution` (#8 persistence).

**Decisions:**
- **`proxy.ts`, not `middleware.ts`** — Next 16.2.6 deprecates the `middleware` file convention; adopted the current name to build without the deprecation warning.
- Feeds are **anonymous ISR** (no auth) — they're public product data by design (Meta/Google crawl them); COGS never appears, `sku_margin_band` is a coarse band only.
- Pixel/GA4/CAPI all **creds-gated**: absent env → the snippet simply doesn't render / CAPI returns `{ok:false}`. Nothing fires without the owner's assets.
- Removed a Phase-1 throwaway (`scripts/count.ts`).

**Non-negotiables touched:** **#1** (`<g:id>` === SKU, + a daily parity cron), **#8** (fbp/fbc from the DB, never cookies, at send time), **#9** (Purchase fires at confirmation, one event_id = orderNumber), **#22** (test_event_code dev-only).

**Open — needs you (all creds-gated; built + unit-tested without them):**
- **Meta assets** — `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_DATASET_ID` + `META_CAPI_ACCESS_TOKEN`, catalog ID (to ingest the feeds). Without them the Pixel/CAPI don't fire and dedup can't be proven live.
- **`NEXT_PUBLIC_GA4_ID`** — GA4 is off until set.
- **`CRON_SECRET`** on Vercel (shared by all three crons).

**Verified (creds-independent):** typecheck, **70 tests** (+11: feed `<g:id>`/price/escaping, CAPI hashing + raw fbp/fbc + fbc format + content_ids), lint (0 errors), build (feeds ISR 6h, crons + proxy registered, no deprecation warnings).

**Next:** Phase 7 — Accounting (double-entry journals #5, delivery journal fires from `markDelivered`, pre-order liability to 2030 #6, landed-cost COGS, balanced-books assertion). No new creds.

---

## 2026-07-15 · Phase 7 · Accounting

Full double-entry (§12). Every financial event posts a **balanced** journal (#5); pre-order/prepaid money is a **liability (2030)** released to income **at delivery** (#6).

**Decision asked (spec self-conflict):** §12.3 books the sale at ship + reverses on RTO; §9.4 says "post the delivery journal on delivered." Owner chose **delivery-time recognition** ([[revenue-recognition-delivered]]). So `markDelivered` posts the sale + COGS; an in-transit RTO reverses nothing (no revenue was recognized); a post-delivery customer return reverses it.

**Shipped:**
- **Chart of accounts (§12.1)** — `accounts` collection + `lib/accounting/accounts.ts` (`CHART`/`ACCT`, idempotent `ensureAccounts`, code→id resolver). Codes are permanent — a beforeChange guard blocks renumbering. Seed: `pnpm payload run scripts/seed-accounts.ts` (28 accounts).
- **Posting rules (§12.3)** — `lib/accounting/postings.ts`, one pure fn per event (PO-receive, advance-received, sale, COGS, customer-return, courier-remit, EPS-settle, RTO-fee, write-off, ad-spend), each returning a balanced `PostingLine[]`. Unit-tested for balance + correct accounts.
- **Journal writer** — `postJournal.ts`: validates balance before any write (#5), resolves codes, auto-opens/rejects a closed `fiscalPeriod` (§12.6), creates draft → lines → posts. Idempotent per `(source,sourceId,ref)`.
- **Collections** — `journalEntries` (+ `enforceJournalBalance` beforeChange: Σdr===Σcr on the posted transition + closed-period reject; beforeDelete blocks deleting a posted entry), `journalLines` (per-leg one-side rule + **posted-entry legs are immutable**), `fiscalPeriods`, `courierPayouts`, `epsSettlements`, and the `settings` global (`vatRatePercent` **0** + banner until the consultant confirms, §12.4/§21).
- **Wiring (#5)** — PO receive → Dr 1050 / Cr 2010 (ties GL to Σ lot landed cost); EPS success → Dr 1030 / Cr 2030 (advance, #6); `markDelivered` → sale (release 2030 + book 1040 → 4010/4020/2020) + COGS (5010 ← 1050); customer return → 4040/1050 ← 1020/5010.
- **Trial balance** (`trialBalance.ts`, §12.6) + int test asserting Σdebits === Σcredits across the lifecycle.

**Adversarial verification** (6-lens finder → 2-skeptic refute, 18 agents) surfaced **4 real bugs, all fixed + regression-tested**:
1. **Discount double-count** — `order.subtotal` is net-of-discount, so booking net to 4010 *and* debiting 4030 unbalanced the sale by `discountTotal` (latent, #5). Now 4010 is booked GROSS and 4030 nets it down.
2. **Race double-post** — find-then-create had no DB uniqueness; an EPS reload / webhook-vs-cron could double-post. Added a **unique index on `(source,sourceId,ref)`** + the writer catches the race and returns the winner.
3. **Write-then-post ordering** — order/txn state was committed before the journal, so a failed post was orphaned (and left 2030 negative). Journals now post **before** the idempotency-gating state in `markDelivered` + `epsCallback`.
4. **Balance-guard bypass (critical)** — editing a *posted* entry's `journalLines` never re-ran the guard. Posted-entry legs are now **immutable** (beforeChange + beforeDelete); corrections go via void + repost.

**Non-negotiables touched:** **#5** (every event a balanced journal; unbalanced can't reach the DB via the writer, the entry hook, OR line edits), **#6** (advance/prepay → 2030 on receipt, released to 4010 only at delivery — later than #6's literal "on ship", strictly more conservative; flagged for the owner in case pre-orders must release at ship).

**Decisions / deferrals:**
- Prod **migration** for the new tables + chart seed must be generated at deploy (`pnpm migrate:create`) — the repo still runs on dev push (no migrations dir yet, all phases). Flagged.
- **Reconciliation UI (§12.5)** (statement upload/match) and the **period-close report CSVs / P&L / balance sheet (§12.6)** are deferred — the collections + posting fns exist so they plug in.
- Pre-order **COGS = 0** until pre-order stock allocation is built (ready-stock COGS is correct). Invoice PDF (§12.4/§11.2) still deferred.
- Latent Phase-4 note: `order.codAmount` is stale for an epsFull ready-prepay order; the sale journal sidesteps it by using `grandTotal − advancePaid`. Flagged for a Phase-4 fix.

**Verified:** typecheck, **95 tests** (+25: 14 posting-rule balances + validateBalance + 7 lifecycle int incl. trial-balance-ties, closed-period reject, posted-line immutability), lint (0 errors), build.

**Next:** Phase 8 — Reports/back-office (§11.6 CSV reports, RTO analytics, reconciliation UI, period close) or as Moshiur directs. No new creds.

---

## 2026-07-15 · Phase 8 · SEO/AEO

Corrected a mislabel: §19 Phase 8 is **SEO/AEO** (not "reports" — that stays deferred). Beat the incumbents on structure. English-only build, so the bilingual pieces (hreflang→bn, Bengali AEO copy, meta.bn sitemap, acceptance #30) collapse to single-locale English — the *structure* is what ships.

**Shipped:**
- **Structured data** (`lib/seo/jsonld.ts` + `<JsonLd>`, `<`→`<` escaped): Organization + WebSite/SearchAction (every page), HealthAndBeautyBusiness/LocalBusiness (home), BreadcrumbList, **Product + Offer with `shippingDetails` (real ৳80/৳110/৳140 from the delivery-charge source, no magic numbers) and `hasMerchantReturnPolicy`** — the two properties every competitor omits — FAQPage from `products.faq`, ItemList (home), DefinedTerm/DefinedTermSet (ingredients). Offer carries `sku` byte-identical to the feed/Pixel/CAPI (#1). **No AggregateRating** — there is no reviews collection, so it can never render fake (#12/#29, satisfied by construction).
- **Technical**: `robots.ts` (GPTBot/ClaudeBot/PerplexityBot/Google-Extended allowed; /admin /api /checkout /account /cart blocked), sitemap index + per-type children (products/ingredients/static), self-referencing canonicals, `llms.txt` + `llms-full.txt`, **IndexNow** ping on product publish (creds-gated INDEXNOW_KEY + `/indexnow-key.txt`).
- **Ingredient glossary** `/ingredients` + `/ingredients/[slug]` (DefinedTerm) with cached data helpers.
- Return-policy config in `settings` (`returnsAccepted` + `returnWindowDays`) so `hasMerchantReturnPolicy` is a real claim, never fabricated — **confirm before go-live**.

**Adversarial verification** (5 lenses → 2 skeptics, 9 agents) found **2 real bugs, both fixed + tested**:
1. **Dead sitemaps (high)** — `sitemap-categories.xml` / `sitemap-brands.xml` emitted `/categories/{slug}` + `/brands/{slug}` URLs but those PLP routes don't exist (deferred in Phase 1) → every entry a 404. Removed both children + routes until the category/brand pages ship.
2. **Offer-less Product (low)** — a published product with zero active variants emitted a Product with no offers/rating → Rich Results ERROR. `productJsonLd` now returns null (no Product node) when there are no variants.

**Non-negotiables touched:** **#1** (Offer.sku === variants.sku, byte-identical), **#12/#29** (AggregateRating cannot render without approved reviews — no reviews collection exists, verified unbypassable).

**Deferred (flagged):** the **blog** (`posts` collection + `/blog` + Article + posts sitemap), the **category/brand PLP routes** (and their sitemaps), and the **dead-SKU 301 `redirects`** collection (§14.1) → Phase 9 Hardening. LocalBusiness `geo`/`openingHours` omitted rather than fabricated (add to settings when known).

**Verified:** typecheck, **110 tests** (+15: Product/Offer sku+shipping+returns, no-rating, AggregateOffer range, pre-order/OOS availability, zero-variant null, FAQPage/ItemList/DefinedTerm, sitemap/robots), lint (0 errors), build.

**Next:** Phase 9 — Hardening (rate limits, RBAC field-level audit — packer can't see landed cost, near-expiry cron, alerts, abandoned-cart release, backup/restore, load test). Plus the Phase-8 deferrals (blog, category/brand pages, redirects).

---

## 2026-07-15 · Phase 9 · Hardening

**Shipped:**
- **RBAC (§4.6, the done-criterion)** — `Users.roles` (owner/manager/inventory/packer/accounts/support) + `lib/auth/roles.ts` (canSeeCost/canAccounting/canInventory + field/collection access). **Landed cost hidden from packer/support** via field-level `read` access on `stockLots.landedCostPerUnit`, `orders.items[].lotAllocations[].landedCostSnapshot`, `purchaseOrders.lines[].unitCostForeign`; accounting collections → owner/manager/accounts only; suppliers/POs → inventory-only; orders locked to staff. **Proven by test** (packer read strips cost, owner sees it, packer denied the ledger). Field access only affects the admin API — storefront + internal reads use overrideAccess.
- **Abandoned-order release cron** (acceptance #11) — `/api/cron/release-stale` + `cancelStaleOrders`: pending >60min → release reservations (#4) + cancel + retire pending txn. Tested (reservations returned).
- **Near-expiry/expiry cron** (§10.3) — `/api/cron/expiry-scan` + `runExpiryScan`: past-EXP → `expired` + `expiryWriteoff` movement + **write-off journal (Dr 5020 / Cr 1050**, wiring Phase-7 `postWriteOff`, #5); 3–6mo → `shortExpiry` flag. <3mo already FEFO-skipped by date. Tested end-to-end.
- **Alerts** (§11.5) — `lib/alerts` (Resend-if-configured-else-log, best-effort) wired into both crons.
- **`docs/OPERATIONS.md`** — backup/restore drill (Neon PITR + pg_dump), load-test (k6), 2FA + cron-secret go-live gates.

**Security-review finding fixed (CRITICAL privesc):** user management was any-authenticated → a packer could create users or edit their own `roles` to owner. Now **user management is owner-only** (§4.6: manager excludes user mgmt), the `roles` field is **owner-only to change**, and non-owners are scoped to their own account (self password/session only).

**Adversarial RBAC sweep** (5 lenses → 2 skeptics, 19 agents): 7 candidate leak paths, **0 confirmed** — no packer-reachable path to landed cost/margin/COGS survived (feed emits only a coarse margin band; populated relationships strip cost; sensitive collections gated).

**Non-negotiables touched:** **#4** (release/expiry via movements only), **#5** (expiry write-off posts a balanced journal). RBAC realizes §4.6's "field-level access matters here."

**Verified:** typecheck, **114 tests** (+4: RBAC packer-can't-see-cost, abandoned release, expiry write-off, + owner-sees-cost), lint (0 errors), build (release-stale + expiry-scan crons registered).

**Deferred/flagged:** 2FA enforcement (§17.2, documented), load-test/backup as operational procedures (docs), blog + category/brand pages + dead-SKU redirects (from Phase 8). Reports/reconciliation-UI/period-close (from Phase 7). LocalBusiness geo/hours.

**Next:** storefront redesign inspired by ghorerbazar.com (owner request 2026-07-15) — conversion landing + on-page COD order form PDP + related products + login, mobile-first + WhatsApp-friendly. Brainstorming the design first.

---

## 2026-07-16 · Storefront redesign (ghorerbazar-inspired)

Owner pivot. Conversion-focused storefront inspired by ghorerbazar.com — front-end reskin + a new on-PDP order flow, **reusing all existing backend** (OTP, computeCheckoutTerms, placeOrder, EPS). Decisions (asked): English-only · on-PDP order form with inline OTP + advance/EPS · keep brand tokens (celadon/ink/paper/seal, Anek) + ghorerbazar layout · phone-OTP login. Spec: `docs/superpowers/specs/2026-07-15-storefront-redesign-design.md`.

**Shipped:**
- **Conversion UI kit** (`components/store/`): PriceTag (slash + −N%), TrustRow, WhatsAppFab, OrderForm, StickyOrderBar, LoginClient.
- **Backend:** `/api/checkout/quote` (live terms — the form never computes numbers, #3), `/api/checkout/quick` (single-line placeOrder, same OTP/COD/EPS/#2 rules as /place), `getRelatedProducts`, `getOrdersByPhone` (safe fields only, #4.6).
- **Pages:** landing restructure (hero / trust / best-sellers / why-buy / shop-all), PDP on-page **OrderForm** (qty → live quote → inline OTP → COD or EPS) + related products + mobile sticky bar, `/login` (phone OTP), `/account` (order tracking by verified phone), floating WhatsApp on every page.
- **Local smoke test — green:** home/PDP/login/account/admin render; **full OTP→COD order placed end-to-end** (DKB-2607-00001, codAmount = grandTotal for Dhaka COD, #2); admin owner login sees orders + landed cost; RBAC live (orders/users staff-only, packer can't; owner can).

**Adversarial verification (5 lenses) → 11 findings, all fixed:**
- **CRITICAL #2** — a full-prepay (epsFull) order stored `codAmount = grandTotal − advance` instead of 0, so the courier would collect the full amount again (customer pays twice). Fixed at source in `placeOrder` (`codAmount = 0` for epsFull) — fixes /place *and* /quick — with a regression test. (Latent since Phase 7; the redesign made it reachable.)
- **OTP retry** — after verify (which consumes the OTP), a failed placement left the buyer stuck re-verifying a consumed code. Now a verified buyer retries **placement** directly.
- **FB in-app browser** — the form now hands back the `intent://` / `x-safari` escape links (§13.5) instead of navigating inside the broken webview.
- Quote race guard (seq); 44px touch targets; input labels; focus-visible ring; OTP live region; **`--grey` darkened (#8e958f→#636863) for WCAG-AA contrast**; sticky bar clears the WhatsApp FAB + footer.

**Non-negotiables:** **#2** (codAmount ≠ grandTotal, epsFull=0 — tested), **#3** (quote/place use only computeCheckoutTerms), **§17.1** (OTP-verified phone before placing), **#4.6** (account/related/quote leak no cost — verified), **#12/#29** (no fake reviews).

**Known limitation / deferred:** an EPS-init 502 after order creation + a retry can create a duplicate pending order (pre-existing in /place too; the Phase-9 abandoned-order cron cancels + releases it within 60 min). Multi-variant products use the cheapest variant in the form (variant picker = follow-up).

**Deploy blocker:** live Vercel is a **stale build with a broken/missing DB env** ([[vercel-deploy-blocker]]) — needs the owner's Vercel dashboard (auto-deploy + env vars + migrations). Verified locally instead; live smoke-test blocked until the owner fixes it.

**Verified:** typecheck, build, lint (0 errors); local smoke test green; test suite green (bumped int-test timeouts — remote Neon latency was spiking to ~8× and timing out an unchanged accounting test).

## 2026-07-16 · Deploy · Vercel → AWS Amplify (LIVE)
**Shipped:** Decor's K-Beauty is live on **AWS Amplify** (ap-southeast-1, WEB_COMPUTE; account #, app id, and default URL are in the private memory, not this public repo). Vercel abandoned. Smoke test green: home/`/search`(12 products)/PDP(prices+12 imgs+add-to-cart)/`/admin`/`/login`/media-from-S3 all 200, no runtime errors.
**Decisions/changes:**
- **Next 16.2.6 → 15.4.11** — Amplify SSR supports Next ≤15; Payload 3.86 peer range allows 15.4.x; no Next-16-only APIs used. (Next 16 built but every SSR route 500'd on Amplify's Turbopack path — missing transitive deps of externalized pkgs.)
- **next.config** externalizes Payload server pkgs (payload/pg/graphql/pino/drizzle/db-vercel-postgres) so the Next-15 webpack build resolves; `revalidateTag(tag)` single-arg (dropped Next-16 'max').
- **Media Vercel Blob → S3** (`@payloadcms/storage-s3`, a private BPA-on bucket + `/api/media/file` proxy, a least-priv IAM user; names in private memory); 84 files migrated; serverURL stays relative.
- **amplify.yml** build spec (corepack pnpm@10.33.3, generate:importmap, no build-time migrate) stored ON the app via update-app (repo file is not auto-used). Crons removed from vercel.json (→ EventBridge, deferred).
- **Runtime env fix:** Amplify SSR compute gets no env at runtime → bake server vars into `.env.production` at build (AWS-documented). Without it Payload threw "missing secret key", all dynamic routes 500'd.
**Non-negotiables touched:** none of #1–#13 semantics changed. #4 (media via storage adapter) now S3. Secrets baked into build artifact (owner authorized) — hardening TODO: SSM + SSR compute role.
**Open:** (1) **No admin user in Neon** — `/admin` shows open first-user form; owner must self-create at /admin to close it. (2) No GitHub auto-build webhook (redeploy via `aws amplify start-job`). (3) Crons (EventBridge+Lambda) deferred — need IAM. (4) Custom domain decorskbeauty.com pending. (5) Security hardening (SSM/compute role).
**Verified:** typecheck + `next build`(15.4.11) + 115 integration tests green locally; 4 Amplify builds (job 4 = green); live smoke test green.
**Next:** owner creates admin → verify admin + customer dashboards end-to-end; then webhook/crons/domain/hardening.

## 2026-07-17 · Redesign · Premium animated storefront + admin CMS (LIVE)
**Shipped:** A full premium redesign — "Webflow-template" look with framer-motion, gradients, and
an evolved brand design system — plus a Payload-driven CMS so the whole landing page + chrome are
owner-editable. Homepage deployed live on Amplify; PDP deploying.
**Design system (Phase 1):** framer-motion + lucide + tailwind-merge; Fraunces (display) + Geist;
`globals.css @theme` evolved palette (celadon anchor + rationed apricot/rose/lilac/sky/honey accents,
aurora meshes, gradient/CTA/text utilities, soft shadows); MotionProvider (LazyMotion) + Reveal/
RevealGroup scroll islands (all reduced-motion safe); UI/shop primitives (Container/Section/Button/
Badge/GradientMesh/StoreImage[AVIF]/ProductCard/Icon).
**Admin CMS (Phase 2):** `Homepage` global = blocks layout builder (hero/trust/featured/category/
promo/bestsellers/testimonials/authenticity/richText/newsletter/cta); `SiteSettings` global
(announcement/header/nav/footer/identity/SEO/delivery+PDP copy — #3: copy only); `Testimonials`
collection (marketing only, kept out of AggregateRating #12); merchandising fields on Products
(isBestSeller/isNew/featuredRank/homeBadge/highlights/crossSell) + Categories (featuredOnHome/
homeOrder/tileImage/accent); lib/commerce readers through the #13 boundary + CONTENT_TAG revalidate;
migration `content_models` (baselined the dev-pushed initial migration first, then applied).
**Homepage (Phase 3):** admin-driven shell (rotating announcement, glass scroll-aware header, footer,
WhatsApp FAB) + BlockRenderer rendering `getHomepage()` blocks; 10 section components built via a
parallel subagent fan-out; `scripts/seed-homepage.ts` seeds a rich default. Verified desktop + mobile.
**PDP (Phase 4):** brand two-column gallery + BuyPanel wrapping the COD-first OrderForm as the primary
path (live quote/OTP/order — #2/#3/#7 unchanged), variant selector, payment marks (COD/bKash/Nagad),
trust strip, ingredients/how-to/FAQ, cross-sell, mobile sticky bar, authenticity line (no public batch
data). Verified desktop + mobile.
**Phase 5 (partial):** branded favicon (app/icon.svg) + 404/error boundaries. Deferred: OG/Twitter
images, order-confirmation SMS, responsive `<picture>` on remaining raw `<img>`, loading skeletons.
**Super-admin:** owner reset + verified (live login "Authentication Passed"); creds in the gitignored
ADMIN_CREDENTIALS.txt via `scripts/provision-admin.ts`.
**Non-negotiables:** money path (checkout terms, codAmount, OTP, EPS) reused UNCHANGED; #12 testimonials
separate from ratings; #13 storefront reads only via lib/commerce; #3 delivery copy never restates
charges. Design tokens section in CLAUDE.md updated so the evolved system isn't regressed.
**Verified:** typecheck + build (60/60) + 115 tests green; homepage live (Amplify job 7); PDP deploying
(job 8). Infra identifiers kept in private memory, not this public repo.
**Next:** finish PDP deploy verify; then OG images, order SMS, image/skeleton polish.

## 2026-07-18 · Ops · Scheduled jobs on Amplify (EventBridge → Lambda → /api/cron/*)
**Shipped:** the five `/api/cron/*` routes are now actually scheduled. Amplify Hosting has no built-in
cron (this is why Vercel's `vercel.json` crons didn't carry over), so they run via **EventBridge
Scheduler → a thin invoker Lambda → the route** (Bearer `CRON_SECRET`, exactly as the routes expect).
Source + deploy/verify doc versioned under `infra/cron-lambda/`.
**Cadence:** courier-sync every 30m (BD webhooks drop — the reconcile is not optional), capi-drain every
15m, release-stale every 30m (`STALE_MINUTES=60` → reservations freed within the hour), sku-parity 02:00
and expiry-scan 02:30 Asia/Dhaka daily.
**Verified:** live test-invoke of the read-only `sku-parity` route returned HTTP 200
`{checked:12, mismatches:[], alert:false}` — end-to-end chain works and the SKU spine (#1) is clean in
production. All 5 schedules created ENABLED.
**Decisions:** Lambda invoker (not a direct EventBridge API-Destination) because API-Destination caps the
call at 5s and the reconcile/drain/scan jobs need longer; the Lambda also gives per-run CloudWatch logs.
**Non-negotiables:** none changed — the routes and their tested core logic (`cancelStaleOrders`,
`runExpiryScan`, CAPI drain, courier reconcile) are unchanged; this only adds the trigger. Account-scoped
ARNs/IDs kept in private memory + placeholder'd in the repo doc, not committed.
**Open:** Lambda `APP_URL` points at the amplifyapp.com origin — repoint to https://decorskbeauty.com when
the custom domain lands (owner deferred the domain). Secret hardening (SSM vs baked/Lambda-env) still open.
**Next:** owner-directed — custom domain when ready, or continue storefront polish.

## 2026-07-18 · Feature · Customer reviews + AggregateRating rich snippets
**Shipped:** a real, moderated product-reviews system — the #12/#29-compliant way to finally get star
rich snippets in Google. Customers submit a rating + review from the PDP; the owner approves in admin;
ONLY approved reviews render or count toward the rating, so it can never be seeded or faked.
**Pieces:** `Reviews` collection (public create → always status=pending; admin-only moderate;
authorPhone/authorIp private via field-level read gate) · `lib/commerce/reviews.ts` behind the #13
boundary (getReviewSummary + listApprovedReviews → phone-free DTOs; `hasPurchasedProduct` sets
verifiedPurchase from a real delivered/paid order; pure `summarize()`) · `POST /api/reviews`
(validate + per-IP/day rate-limit + per-phone+product dedupe + slug-resolved product, never a client id)
· `productJsonLd` now emits AggregateRating + Review only when real approved reviews exist ·
PDP section (summary + distribution bars + list + accessible star-picker form + honest empty state +
above-the-fold rating link).
**Migration:** `20260717_182127_reviews`. Dev-push (Payload push:!isProd, tripped when the int test booted
against the shared Neon DB) had already created the table, so `pnpm migrate` hit "type already exists" —
baselined the record at batch 3 (table verified present with all 13 columns). Same pattern as the initial
baseline earlier.
**Non-negotiables:** #12/#29 honoured (real approved reviews only — verified in tests: count 0 → no
aggregateRating) · #13 (storefront reads only via lib/commerce; DTO strips the private phone) · product
titles/English unchanged. Nothing in the money path touched.
**Verified:** tsc clean · 127 unit/int tests (added reviews + jsonld-rating specs) · production build
succeeds (PDP still SSG). Deploying as commit 7fac2f0.
**Next:** verify live (empty state + form + AggregateRating once a review is approved); then owner-directed
(custom domain when ready).
