# Decor's K-Beauty — Premium Animated Redesign + Admin-Managed Storefront

> **For agentic workers:** Implement task-by-task with superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** Turn the storefront into a premium, animated, Bangladesh-friendly K-beauty store whose entire landing page and marketing chrome are editable from the Payload admin — a "Webflow-template" look (framer-motion, gradients, tasteful color) built on the brand identity, with the COD-first order flow wired in.

**Architecture:** Keep the strong backend (commerce engine, SEO/JSON-LD, `lib/commerce` decoupling) untouched. Add a block-based content model in Payload (`Homepage` global + `SiteSettings` global + `Testimonials`/`Pages` collections + merchandising fields), expose it through new `lib/commerce` readers (unstable_cache + a `content` revalidate tag, honoring non-negotiable #13), and rebuild the view layer on ONE consolidated design system with a framer-motion motion system. Delete the two orphaned/duplicate component families.

**Tech Stack:** Payload 3.86, Next 15.4 (App Router SSR, webpack for Amplify), React 19, Tailwind v4.1 (`@theme` in globals.css), framer-motion, lucide-react, next/font.

## Global Constraints (verbatim, apply to every task)

- **Next stays 15.4.11** (Amplify SSR ≤15). No Next-16-only APIs. Do not bump.
- **Non-negotiable #13:** storefront never imports `src/collections/**` or calls `payload.find()/findGlobal()` directly — always through `src/lib/commerce/**`.
- **#3:** delivery/advance/COD numbers exist ONLY in `computeCheckoutTerms`. Admin content may hold delivery *copy*, never the numeric charges.
- **#2:** `orders.codAmount` (not grandTotal) goes to courier; epsFull → 0.
- **#12:** `AggregateRating` renders only from real approved reviews. Testimonials are marketing social-proof ONLY — never feed Product/Offer structured-data ratings.
- **#1:** `variants.sku` identity spine unchanged; keep it byte-identical in feeds/Pixel/CAPI.
- **English-only** (i18n dropped). Product titles English; everything else English.
- Prod DB is Neon (pooled). `push:false` in prod → schema changes ship via a migration.
- Verify gates before "done": `pnpm typecheck`, `pnpm test`, `pnpm build` all green.
- Deploy target AWS Amplify (build spec bakes env to `.env.production`; media on S3).
- Preserve `src/lib/seo/**` behavior (JSON-LD graph, sitemaps, robots, llms.txt, IndexNow).

## Design System (locked — "Modern K-Beauty Apothecary × premium Webflow")

**Palette** (evolve the brand — colorful + gradients, anchored on celadon, NOT fake-seller pink):
- Base: `--paper #F2F4F1`, `--ink #14181A`, surfaces `--cloud #FBFCFB`, `--mist #E9EEE9`.
- Brand green: `--celadon #7FA893`, `--celadon-deep #2F5D4A`, `--celadon-ink #1E3D30`.
- Accents (rationed, for gradients/highlights): `--apricot #F5C9A6`, `--rose-clay #E39B8C`, `--lilac #CFC9F0`, `--sky #A9D8E4`, `--honey #E9B949`.
- Rationed alert: `--seal #C0362C` (authenticity/expiry ONLY).
- Gradient meshes: `--grad-hero` (celadon→sky→apricot soft aurora), `--grad-bloom` (apricot→rose-clay), `--grad-mint` (celadon→sky), `--grad-cta` (celadon-deep→celadon). All low-saturation, blurred, premium.
- Text meta: `--grey #636863` (AA-safe).

**Typography** (distinctive, not generic-sans template):
- Display: **Fraunces** (variable editorial serif, warm/premium) — headlines, section titles.
- Body: **Geist Sans** (clean grotesk) — UI/paragraphs.
- Data/mono: **Geist Mono** — prices, SKU, batch, tracking (evidential voice).
- All via `next/font` (self-hosted, subset, zero CLS).

**Motion (framer-motion):** `LazyMotion`+`domAnimation`; variants `fadeUp/fadeIn/stagger/scaleIn/blurUp`; scroll reveals via `whileInView once`; hero orchestrated load sequence + floating gradient blobs with subtle parallax; card hover lift + image zoom; scroll-aware glass navbar. **Every** animation guarded by `prefers-reduced-motion` (useReducedMotion → no transforms).

**Signature:** the **authenticity proof** stays the brand argument — a refined "authenticity slip" band on the PDP (batch/EXP/verify) in mono with the red seal, plus a homepage "Why 100% authentic" section.

---

## Phase 1 — Foundation (design system + motion + primitives) [do inline, coherence-critical]

### Task 1: Dependencies + font wiring
- Add `framer-motion`, `lucide-react`, `tailwind-merge`. Verify `sharp` still resolves after install.
- Wire Fraunces (display) via `next/font/google` alongside Geist; expose `--font-display`.
- Accept: `pnpm typecheck` green; fonts load in a scratch render.

### Task 2: Design tokens in `globals.css` (@theme)
- Add the full palette, gradient tokens, radii, shadows (`--shadow-soft/lift/glow`), motion durations/easings, `--font-display`.
- Add global `:focus-visible` ring; `@media (prefers-reduced-motion)` disabling `.animate-*` + a `.motion-safe` convention.
- Retire ad-hoc `neutral-*`/`blue-600` from shared chrome (map to brand tokens).
- Accept: build green; tokens referenceable as Tailwind utilities.

### Task 3: UI + motion primitives (`src/components/ui/**`, `src/components/motion/**`)
- `Container`, `Section` (padding rhythm + optional gradient bg), `Button` (variants: primary/celadon gradient, secondary/outline, ghost; sizes; 44px min), `Badge`, `Pill`, `GradientMesh`, `Reveal` (scroll reveal wrapper), `Stagger`, `MotionProvider` (LazyMotion), `useReveal` variants.
- Accept: typecheck/build green; Storybook-less visual check via a scratch page.

---

## Phase 2 — Admin content models (Payload) [subagent-friendly, well-specified]

### Task 4: `SiteSettings` global (slug `site-settings`, group `Content`)
- Groups: `announcementBar` (enabled, messages[] {text, link?}, rotate, background(brand select), startAt?, endAt?), `header` (logo, logoDark, wordmark, tagline, primaryNav[] {label, href|category}), `footer` (columns[] {heading, links[]}, socials[], whatsappNumber, contact{address,phone,email}, paymentMarks[], copyright), `businessIdentity` (siteName, phone, address parts, aboutBlurb), `seo` (defaultMetaTitle, defaultMetaDescription, defaultOgImage), `deliveryPromise` (freeShipHeadline, zoneBlurb, etaCopy — COPY ONLY, no charges), `productPage` (stockPromiseTemplate, authenticityCopy).
- Register in `payload.config.ts`; add `access.read: () => true` for public groups where needed.

### Task 5: `Homepage` global (slug `homepage`, group `Content`) — blocks layout builder
- `layout` blocks field with blocks: `HeroBlock`, `TrustBadgesBlock`, `FeaturedProductsBlock`, `CategoryGridBlock`, `PromoBannerBlock`, `BestSellersBlock`, `TestimonialsBlock`, `AuthenticityBlock`, `RichTextBlock`, `NewsletterBlock`, `CtaBlock`. Each block carries its own copy/media/CTA/theme(select from gradients)/layout fields.
- `seo` group for the home route.

### Task 6: `Testimonials` collection + merchandising fields
- `Testimonials` (name, location, avatar, rating 1-5, quote, product?, approved, featured, order). Kept OUT of AggregateRating.
- Products: `featuredRank`(number), `isBestSeller`, `isNew`, `homeBadge`(select), `highlights`[] (bullets), `crossSell`(rel hasMany).
- Categories: `featuredOnHome`, `homeOrder`, `tileImage`, `accent`(brand select).

### Task 7: `lib/commerce` readers + revalidation + migration
- `src/lib/commerce/content.ts`: `getSiteSettings()`, `getHomepage()` (unstable_cache, `CONTENT_TAG`).
- `products.ts`: `listFeaturedProducts()`, `getBadgedProducts()`, `getCrossSell(slug)`.
- `categories`/`index.ts`: `listFeaturedCategories()`. `testimonials.ts`: `listApprovedTestimonials()`.
- `tags.ts`: add `CONTENT_TAG`. `revalidate.ts`: afterChange/afterDelete hooks on the new globals/collections.
- Generate + run a Payload migration for the schema (out-of-band; never in the Amplify build).
- Accept: readers typed; a unit/int test that `getHomepage()` returns blocks; migration applies.

---

## Phase 3 — Landing page rebuild (Webflow-grade, animated) [inline + subagent per block]

### Task 8: App shell — AnnouncementBar, Navbar (glass, scroll-aware), Footer (admin-driven)
### Task 9: Block renderer + HeroBlock (gradient mesh, orchestrated load, floating cards, parallax)
### Task 10: TrustBadges + FeaturedProducts (animated grid, badges, responsive `<picture>` AVIF, LCP priority on first)
### Task 11: CategoryGrid (bento) + PromoBanner + BestSellers carousel (reduced-motion safe)
### Task 12: Testimonials + Authenticity ("why 100% real") + Newsletter/CTA
### Task 13: page.tsx renders `getHomepage()` blocks; seed sensible default homepage content via migration/seed so it's non-empty on first load
- Accept per task: typecheck/build green, visual smoke via real Amplify or `next start` screenshot, reduced-motion verified.

---

## Phase 4 — Product page rebuild (premium + BD COD-first)

### Task 14: Gallery (animated thumbnails/zoom) + product header (price/discount, rating IF real, USP highlights)
### Task 15: Wire COD-first `OrderForm` as primary path (qty, live quote, inline OTP, COD/online, WhatsApp/call) + payment marks (bKash/Nagad/card via EPS) + free-ship progress
### Task 16: Trust/delivery strip + refined AuthenticitySlip + StickyOrderBar (mobile) + WhatsAppFab (global)
### Task 17: Description/How-to-use/Ingredients(INCI)/FAQ tabs-accordion + cross-sell/related (animated)
- Accept: order can be placed end-to-end on the deployed site; codAmount correct; a11y (focus, labels, reduced-motion).

---

## Phase 5 — Cross-cutting: perf, a11y, SEO polish

### Task 18: Responsive `<picture>` AVIF everywhere (retire raw `<img>`), LCP priority, media Cache-Control/preconnect
### Task 19: OG/Twitter metadata + `opengraph-image` (next/og) for home+PDP; favicon/icon/apple-icon/manifest; fix JSON-LD logo
### Task 20: `loading.tsx` (branded skeletons), `error.tsx`, `not-found.tsx`; conformant CartModal (aria-modal, focus trap, Esc); global focus rings; reduced-motion audit
### Task 21: Wire order-confirmation SMS (placeOrder COD + EPS success) [BD trust] — if time permits this phase

---

## Phase 6 — Verify, deploy, super-admin, git

### Task 22: Full gates (typecheck/test/build), run migration on Neon, commit per-phase with clean messages (no infra ids)
### Task 23: Deploy to Amplify (start-job), smoke test home/PDP/admin/media, fix runtime issues
### Task 24: Create super-admin owner; deliver credentials via a non-transcript method (write to a local gitignored file or user self-creates); update CLAUDE.md design section + JOURNEY + memory

## Self-review notes
- Every schema change → migration (never build-time). Every new admin field → a `lib/commerce` reader (never direct payload calls in storefront). Every animation → reduced-motion guard. Testimonials strictly separate from AggregateRating. Delivery numbers stay in `computeCheckoutTerms`.
