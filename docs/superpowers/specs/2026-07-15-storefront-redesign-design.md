# Storefront redesign — ghorerbazar-inspired · Decor's K-Beauty

Owner-approved 2026-07-15. Conversion-focused storefront inspired by ghorerbazar.com, applied to the existing K-Beauty build. **Front-end reskin + a new on-PDP order flow — reuses all existing backend** (OTP, `computeCheckoutTerms`, `placeOrder`, EPS).

## Locked decisions
- **English-only** (owner's standing decision).
- **On-PDP order form** with inline OTP + advance/EPS preserved (not ghorerbazar's no-OTP instant COD).
- **Keep brand tokens** (celadon / ink / paper / seal, Anek font) + ghorerbazar's **conversion layout**.
- **Login = phone + OTP** (no password, §17.1).

## Guardrails (non-negotiable)
`codAmount ≠ grandTotal` (#2) · `computeCheckoutTerms` is the ONLY source of delivery/advance/COD numbers (#3) · OTP-verified phone before an order is placed (§17.1) · advance via EPS for outside/pre-order/>৳5k · no colour outside the token set · product titles English (#10) · **no fabricated reviews/AggregateRating** (#12/#29) · storefront reads only via `lib/commerce` (#13).

## Components / units

**Conversion UI kit** (`src/components/store/`) — existing tokens only:
- `OrderButton` — solid deep-celadon, full-width on mobile.
- `PriceTag` — sale price + slashed MRP + "−N%" (extends existing `Price`).
- `Badge` — `DiscountBadge` (seal-red, rationed to real offers), `StockBadge` (in stock / pre-order / low).
- `TrustRow` — Authentic · COD · 2–3 day Dhaka · Verify batch.
- `WhatsAppButton` / floating FAB — prefilled `wa.me` message with product + SKU.
- `StickyOrderBar` (client) — mobile PDP: price + "Order now" → scrolls to the form.

**Backend (small, new):**
- `lib/commerce/related.ts` → `getRelatedProducts(productId, limit)` — same category/brand, active, excludes self, cached.
- `POST /api/checkout/quote` → returns `computeCheckoutTerms` for `{lines:[{variantId,qty}], zone}` so the PDP form shows live delivery/advance/COD without duplicating math (#3).
- The PDP form places a **single-line** order via the existing `placeOrder` path (`/api/checkout/place` already accepts the cart; add a quick-order that seeds a one-item cart or calls `placeOrder` directly). Reuse `/api/otp/request|verify` + the `dkb_phone` verified cookie.

**Pages:**
- `/` — hero (authenticity thesis + Shop/Verify CTAs) → TrustRow → best-sellers grid → "Why buy from us" (batch/import-lot/EXP argument) → shop-all grid → footer. **No testimonials** (no reviews collection; authenticity strip instead).
- `/products/[slug]` — gallery + authenticity slip (kept) · brand/title/PriceTag · **OrderForm** (client: qty → live subtotal → name/phone/address/**area select** → live terms from `/api/checkout/quote` → Confirm → inline OTP → place COD or route to EPS) · WhatsApp + Call · sticky mobile bar · how-to-use / INCI / FAQ · **Related Products**. Existing JSON-LD kept.
- `/login` — centered card: phone → send code → OTP → verify (reuses OTP, sets cookie) → `/account` order list (track by phone). No password.
- `/account` — minimal "my orders" (by verified phone).

**Mobile + WhatsApp:** 360px-first, sticky order bar, area picker bottom-sheet, ≥44px targets, floating WhatsApp on every page.

## Data flow (PDP order)
1. Client OrderForm: qty + area → `POST /api/checkout/quote` → live {delivery, advance, codAmount, grandTotal}.
2. Confirm → if phone not verified: `POST /api/otp/request` → inline code → `POST /api/otp/verify` (sets `dkb_phone`).
3. Place → single-line `placeOrder` → COD (done) or EPS advance (redirect to hosted checkout / in-app interstitial). Purchase fires at confirmation (#9).

## Out of scope (this round)
Blog, category/brand PLP pages, reviews collection, reconciliation/period-close UI, invoice PDF. Cart page stays as-is (PDP form is the primary path).

## Deploy note
Live Vercel deploy is stale + DB-env broken ([[vercel-deploy-blocker]]) — needs owner's Vercel dashboard. Redesign will be verified locally + via gates; live smoke-test blocked until the owner fixes env + auto-deploy.
