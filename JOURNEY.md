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
