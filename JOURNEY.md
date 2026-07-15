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
