# Decor's K-Beauty — Master Build Prompt

**Target agent:** Claude Code
**Repo:** `decorskbeauty`
**Read this whole file before writing a single line.** Then read `CLAUDE.md` and follow the JOURNEY log workflow.

---

## 0. Mission

Build the e-commerce platform for **Decor's K-Beauty**, a Korean skincare and haircare retailer in Banani, Dhaka.

The market is crowded. Korean Mart BD, Shine Skin Concern, Koreana, kcarebd.com and koreanshopbd.com are all live and all claim "100% authentic". That claim is table stakes, not positioning. This build wins on three things a competitor cannot copy in a weekend:

1. **Provable authenticity.** Every unit ships from a tracked import lot with a batch code, MFG/EXP date, and scanned import documents. The customer can verify it.
2. **Speed on a bad connection inside the Facebook in-app browser.** That is where 70%+ of BD beauty traffic actually lives.
3. **Measurement that survives Safari and ad blockers.** Pixel-only tracking loses 20-40% of conversions. Server-side CAPI with correct deduplication is built in from day one, not bolted on later.

Everything in this spec serves one of those three, or it serves basic order-to-cash correctness.

---

## 1. Locked business facts

Do not invent, change, or "improve" any of these.

| Fact | Value |
| --- | --- |
| Brand name | Decor's K-Beauty |
| Tagline | 100% Authentic Korean Skincare & Haircare |
| Domain | `decorskbeauty.com` |
| Address | Flat B5, House 32-34, Road 7, Block C, Banani, Dhaka 1212, Bangladesh |
| Phone | 01712-113032 (E.164: `+8801712113032`) |
| Catalog size | 50 SKUs at launch, architecture must hold 1,500 |
| Variants | Enabled: size, shade, bundle |
| Fulfilment modes | Ready stock (COD allowed) **and** Pre-order (100% advance, 12-18 day ETA) |
| Batch tracking | Mandatory: lot + MFG/EXP per intake, FEFO allocation, expiry visible on PDP |
| Payment | Cash on Delivery + EPS (new merchant under Decor's trade license; PPA sandbox creds for dev only) |
| Courier | Pathao Courier API primary, Steadfast fallback, fraud check at checkout |
| Locale | Bilingual. Bengali default at `/`, English at `/en`. **Product names are always English.** |
| SMS | Gennet (see §17.3 for the adapter requirement) |
| Accounting | Full double-entry, landed cost, FEFO COGS, VAT, AR/AP, CSV export |
| Meta | Create new Business Manager + Pixel + Catalog + CAPI dataset |

### 1.1 Delivery and payment policy (exact)

| Zone | Delivery charge | COD rule |
| --- | --- | --- |
| Dhaka City | ৳80 | Full COD allowed |
| Dhaka Sub-urban | ৳110 | Full COD allowed |
| Outside Dhaka | ৳140 | ৳200 advance required, remainder COD |

Additional rules, applied in this order:

1. **Order total > ৳5,000** → 30% of grand total required as advance, regardless of zone. This supersedes the flat ৳200 outside-Dhaka advance (take the higher of the two, never both).
2. **Order subtotal ≥ ৳4,999** → delivery charge = ৳0. Threshold is measured on subtotal after discount, before delivery.
3. **Any pre-order line in the cart** → the entire order is 100% advance. No COD. This supersedes rules 1 and 2 for the advance calculation, but free-shipping still applies.
4. Advance is always collected via EPS. There is no partial-COD-plus-cash-advance path.

Encode this as a single pure function `computeCheckoutTerms(cart, zone)` returning `{ deliveryCharge, advanceRequired, codAmount, grandTotal, reason[] }`. Unit test every branch. This function is the only place these numbers exist. No magic numbers anywhere else in the codebase.

---

## 2. Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js (App Router), latest stable | Pin the exact version in `package.json`. Do not use `latest` ranges. |
| CMS + backend | Payload CMS 3.x, installed into the same `/app` folder | One repo, one deploy |
| DB | Neon Postgres | Use `@payloadcms/db-vercel-postgres` |
| Hosting | Vercel | See §2.1, this has real constraints |
| Media | Vercel Blob via `@payloadcms/storage-vercel-blob` | See §15.4 on image cost |
| Email | Resend | Transactional only |
| SMS | Gennet via provider-agnostic adapter | §17.3 |
| Payments | EPS hosted checkout | Use the `eps-payment-gateway` skill. Follow it exactly. |
| Styling | Tailwind | Tokens from §16, no arbitrary values outside the token set |
| Package manager | pnpm | |

### 2.1 Payload on Vercel: known constraints, read before building

Payload was designed for a persistent Node server. On Vercel serverless it initializes on every cold start, and its Drizzle connection pool was sized for persistent-server behaviour. At 50-1500 SKUs and BD-scale traffic this is fine, but only if you respect these rules:

- Use the **Neon pooled connection string** (the `-pooler` host). Never the direct one.
- Set `push: false` in production. Use generated migrations. `push: true` against production will lose data.
- **The storefront must not call Payload's Local API on hot paths.** Storefront reads go through cached route handlers / ISR with `revalidateTag`. Payload's Local API is for admin, webhooks, and cron only.
- Long jobs (PO receive with many lots, catalog feed generation, accounting period close, bulk courier push) run in **Vercel Cron routes with `maxDuration` raised**, never inside an admin request-response cycle.
- If admin operations start timing out as the catalog grows past ~800 SKUs, the escape hatch is to split Payload onto a persistent Node host and keep the storefront on Vercel. Design the code so this is a config change, not a rewrite: no direct Payload imports in storefront components.

---

## 3. Repo layout

```
decorskbeauty/
├── CLAUDE.md                  # continuity, read first
├── JOURNEY.md                 # append-only build log
├── .env.example
├── src/
│   ├── app/
│   │   ├── (storefront)/
│   │   │   ├── [locale]/      # 'bn' | 'en', bn rewritten from /
│   │   │   └── layout.tsx
│   │   ├── (payload)/
│   │   │   └── admin/[[...segments]]/
│   │   └── api/
│   │       ├── track/          # CAPI relay
│   │       ├── feed/           # meta.xml, meta.bn.xml, google.xml
│   │       ├── payments/eps/   # checkout, success, fail, cancel
│   │       ├── courier/        # webhooks: pathao, steadfast
│   │       ├── otp/            # request, verify
│   │       └── cron/           # feeds, courier-sync, abandoned-cart, expiry-scan
│   ├── collections/            # Payload collections
│   ├── globals/                # Settings, Navigation, ShippingZones
│   ├── lib/
│   │   ├── commerce/           # computeCheckoutTerms, cart, pricing
│   │   ├── inventory/          # FEFO allocator, lot ledger
│   │   ├── accounting/         # posting rules, journal writer
│   │   ├── integrations/       # eps, pathao, steadfast, sms, meta
│   │   ├── seo/                # jsonld builders, sitemap, hreflang
│   │   └── browser/            # in-app browser detection, resume tokens
│   ├── components/
│   └── payload.config.ts
└── tests/
```

Hard rule: `src/app/(storefront)/**` may not import from `src/collections/**` or call `payload.find()` directly. It reads through `src/lib/commerce/**`, which reads through cached data-access functions. This keeps the Vercel escape hatch in §2.1 open.

---

## 4. Data model

Payload collections. Field names are normative.

### 4.1 Catalog

**`brands`** — `name` (text, EN, not localized), `slug`, `logo` (upload), `countryOfOrigin`, `story` (richText, localized), `seo`.

**`categories`** — `name` (text, **localized**), `slug` (text, **not localized**, Latin only), `parent` (self-rel), `image`, `description` (richText, localized), `seo`.

> Slugs stay Latin and unlocalized in both locales. A Bengali URL slug becomes percent-encoded garbage in shares, ads, and analytics, and doubles your redirect surface. Localize the display name, not the path segment.

**`products`**

| Field | Type | Notes |
| --- | --- | --- |
| `title` | text, EN only | Never localized. Locked business rule. |
| `slug` | text, unique | |
| `brand` | rel → brands | |
| `categories` | rel → categories, hasMany | |
| `shortDescription` | textarea, localized | |
| `description` | richText, localized | Bengali written natively, not translated |
| `howToUse` | richText, localized | |
| `inci` | textarea, EN | Full INCI ingredient list, verbatim from packaging |
| `keyIngredients` | rel → ingredients, hasMany | |
| `productType` | select | cleanser, toner, essence, serum, ampoule, moisturizer, sunscreen, mask, exfoliator, eyeCream, shampoo, conditioner, hairTreatment, tool, set |
| `routineStep` | number 1-6, nullable | Powers the routine builder. Null for haircare and tools. |
| `skinTypes` | select hasMany | dry, oily, combination, sensitive, normal, acneProne |
| `concerns` | select hasMany | acne, pigmentation, dullness, aging, pores, redness, hairfall, dandruff, frizz |
| `images` | array of upload | `alt` localized per image |
| `fulfilmentMode` | select | readyStock, preOrder, both |
| `faq` | array, localized | `{question, answer}`. Powers FAQPage JSON-LD. |
| `seo` | group, localized | metaTitle, metaDescription, ogImage |
| `_status` | draft/published | |

**`ingredients`** — `name` (EN), `nameLocalized` (localized), `slug`, `definition` (richText, localized), `benefits`, `cautions`. Powers `DefinedTerm` JSON-LD and the ingredient glossary. This is the AEO surface: when someone asks an assistant "নিয়াসিনামাইড কী করে", this is the page that should answer.

**`variants`** — separate collection, **not** an array on products. At 1,500 SKUs × size × shade, an array field will not survive.

| Field | Type | Notes |
| --- | --- | --- |
| `product` | rel → products | |
| `sku` | text, unique, indexed | **This is the `retailer_id` for the Meta catalog and the `content_ids` value in every Pixel event. It is the single identity spine of the whole system.** |
| `optionSize` | text, nullable | "50ml" |
| `optionShade` | text, nullable | "21 Light Beige" |
| `optionBundle` | text, nullable | "Pack of 2" |
| `barcode` | text, nullable | |
| `mrp` | number | Regular price, BDT |
| `salePrice` | number, nullable | |
| `saleStart`, `saleEnd` | date, nullable | |
| `weightGrams` | number | Required. Pathao rejects orders without weight. |
| `preOrderLeadDays` | number, default 15 | |
| `image` | rel → media, nullable | Variant-specific shot (shade swatch) |
| `active` | checkbox | |
| `availableQty` | number, **read-only** | Denormalized. Maintained only by the stock-movement hook. Never written directly. |

### 4.2 Inventory

**`purchaseOrders`** — the import.

`poNumber`, `supplier` (rel), `currency` (KRW/USD), `fxRate` (number, to BDT), `lines` (array: `variant`, `qty`, `unitCostForeign`), `freightBDT`, `dutyBDT`, `vatAtImportBDT`, `clearingBDT`, `otherChargesBDT`, `allocationBasis` (select: byValue | byWeight | byQty, default byValue), `status` (draft | ordered | inTransit | customs | received | closed).

On `status → received`, a hook creates `stockLots` and computes `landedCostPerUnit` per line:

```
lineForeignCost      = qty × unitCostForeign
lineBDTCost          = lineForeignCost × fxRate
overheadPool         = freight + duty + vatAtImport + clearing + other
allocationWeight     = per allocationBasis (value | weight | qty)
lineOverheadShare    = overheadPool × (lineWeight / totalWeight)
landedCostPerUnit    = (lineBDTCost + lineOverheadShare) / qty
```

Round to 4 decimals internally, 2 for display. This number drives COGS forever. Get it right.

**`stockLots`** — the batch. This is the authenticity spine.

`variant` (rel), `lotCode` (text, the code printed on the package), `mfgDate`, `expDate`, `qtyReceived`, `qtyAvailable`, `qtyReserved`, `qtyDamaged`, `purchaseOrder` (rel), `landedCostPerUnit` (number, read-only, set at receive), `receivedAt`, `importDocs` (array of upload: invoice, BL, customs release, brand authorization), `status` (open | depleted | quarantined | expired).

**`stockMovements`** — immutable append-only ledger. Never update or delete a row.

`lot` (rel), `variant` (rel), `qty` (signed number), `type` (receipt | reserve | release | ship | returnRestock | damage | adjustment | expiryWriteoff), `refType`, `refId`, `actor` (rel → users), `at`.

Every change to `stockLots.qtyAvailable` and `variants.availableQty` happens through a movement. There is no other write path. If you find yourself writing `qtyAvailable` directly, stop and write a movement instead.

**`suppliers`** — `name`, `country`, `contact`, `defaultCurrency`, `notes`.

### 4.3 Orders

**`orders`**

| Field | Notes |
| --- | --- |
| `orderNumber` | Format `DKB-YYMM-#####`, sequential per month, generated server-side under a DB-level unique constraint. |
| `channel` | web \| facebook \| phone \| walkIn |
| `customer` (rel), `phone`, `email` | Phone is the identity spine, not email. |
| `locale` | bn \| en. Every SMS and email for this order uses this locale. |
| `items` | array. Each: `variant` (rel), plus **snapshots**: `titleSnapshot`, `skuSnapshot`, `unitPriceSnapshot`, `qty`, `lineTotal`, `fulfilmentMode`, `lotAllocations[{lot, qty, landedCostSnapshot}]`. Snapshots are mandatory. When the price changes next month the old invoice must not change. |
| `orderType` | ready \| preorder \| mixed |
| `subtotal`, `discountTotal`, `deliveryCharge`, `grandTotal` | All from `computeCheckoutTerms`. |
| `advanceRequired`, `advancePaid`, `codAmount` | |
| `paymentMethod` | cod \| epsFull \| epsAdvance |
| `paymentStatus` | unpaid \| advancePaid \| paid \| refunded \| partialRefund |
| `fulfilmentStatus` | pending \| confirmed \| packed \| handedToCourier \| inTransit \| delivered \| returned \| cancelled |
| `zone` | dhakaCity \| dhakaSub \| outside |
| `shipping` | group: name, phone, altPhone, address, cityId, zoneId, areaId (Pathao IDs), landmark, postcode |
| `courier` | group: provider (pathao \| steadfast \| manual), consignmentId, trackingCode, pushedAt, lastSyncAt |
| `fraudCheck` | group: provider, totalParcels, delivered, cancelled, successRatio, checkedAt, decision (pass \| review \| block), raw (json) |
| `attribution` | group: fbp, fbc, fbclid, utmSource, utmMedium, utmCampaign, utmContent, utmTerm, clientIp, userAgent, landingPath, **eventIds** (json: `{viewContent, addToCart, initiateCheckout, purchase}`) |
| `riskFlags` | select hasMany: newCustomer, highValue, repeatCanceller, addressMismatch, inAppBrowser |
| `timeline` | array: `{at, actor, event, note}`. Append-only. |
| `internalNotes` | richText, staff only |

> **`attribution.fbp` and `attribution.fbc` are persisted on the order row, not read from cookies at Purchase time.** Safari ITP will have killed the cookie by then. Capture at first touch, store in the DB against the cart, carry to the order. This one decision is worth more than the rest of the tracking setup combined.

**`transactions`** — EPS.

`order` (rel), `merchantTransactionId` (text, unique, indexed), `epsTransactionId`, `amount`, `purpose` (advance | full), `status` (pending | success | failed | cancelled | unknown), `rawInit` (json), `rawVerify` (json), `verifiedAt`, `financialEntity`.

**`carts`** — server-side, keyed by an HttpOnly cookie. Needed for `InitiateCheckout` CAPI, abandoned-cart SMS, and the in-app-browser resume token. Fields: `token`, `items[]`, `customer` (nullable), `phone` (nullable), `attribution` (same group as orders), `expiresAt`, `abandonedNotifiedAt[]`.

**`returns`** — `order` (rel), `type` (rto | customerReturn), `items[{variant, qty, condition}]`, `reason`, `condition` (resellable | damaged), `restockLot` (rel, nullable), `refundAmount`, `refundMethod`, `status`.

**`customers`** — `phone` (unique, indexed, **the primary key of customer identity**), `name`, `email` (nullable), `addresses` (array), `defaultAddress`, `locale`, `orderCount`, `deliveredCount`, `cancelledCount`, `lifetimeValue`, `riskFlag`, `blacklisted` (checkbox), `blacklistReason`.

**`reviews`** — `product` (rel), `variant` (rel, nullable), `order` (rel, nullable), `customer`, `rating` (1-5), `title`, `body`, `photos[]`, `verifiedPurchase` (checkbox, **set by hook, never by hand**), `status` (pending | approved | rejected), `locale`.

### 4.4 Accounting

**`accounts`** — `code`, `name`, `type` (asset | liability | equity | income | expense), `parent` (self-rel), `active`.

**`journalEntries`** — `date`, `ref`, `source` (order | purchaseOrder | courierPayout | epsSettlement | manual | systemClose), `sourceId`, `memo`, `status` (draft | posted | void), `postedBy`, `postedAt`, `period` (rel).

**`journalLines`** — `entry` (rel), `account` (rel), `debit`, `credit`, `orderRef`, `poRef`.

Enforce in a `beforeChange` hook on `journalEntries`: `sum(debit) === sum(credit)` to 2dp, and every line has exactly one of debit or credit non-zero. Reject the write otherwise. A journal that does not balance must never reach the database.

**`fiscalPeriods`** — `month` (YYYY-MM), `status` (open | closed), `closedAt`, `closedBy`. Posting to a closed period is rejected.

**`courierPayouts`** — `provider`, `periodStart`, `periodEnd`, `consignments[]`, `codCollected`, `courierFee`, `rtoFee`, `netReceived`, `reconciledAt`, `variance`.

**`epsSettlements`** — `periodStart`, `periodEnd`, `transactions[]`, `gross`, `mdr`, `netReceived`, `reconciledAt`, `variance`.

### 4.5 Content and config

`posts` (bilingual blog), `pages`, `coupons`, `banners`, `redirects`, `stockAlerts` (back-in-stock subscriptions).

Globals: `settings`, `navigation`, `shippingZones`.

### 4.6 Roles

| Role | Can |
| --- | --- |
| `owner` | Everything |
| `manager` | Everything except period close and user management |
| `inventory` | products, variants, lots, POs, receive, adjustments |
| `packer` | Orders: view, pack, print label/invoice. Sees COD amount. Cannot see landed cost, margin, or any accounting collection. |
| `accounts` | journals, payouts, settlements, reports. **Read-only** on orders. Cannot edit an order to fix a journal. |
| `support` | Orders view, customer comms, address edit before pack. No financial edits. |

Field-level access matters here, not just collection-level. `variants.landedCostPerUnit` and every margin figure must be invisible to `packer` and `support`.

---

## 5. Internationalization

- Payload localization: `locales: ['bn', 'en']`, `defaultLocale: 'bn'`, `fallback: true`.
- Routing: Bengali serves at `/`, `/products/[slug]`, `/c/[category]`. English serves at `/en/...`. Implement with a `[locale]` segment plus a middleware rewrite so `/` maps to `bn` without a redirect. No `/bn` prefix in the canonical URL.
- `hreflang`: `bn-BD` → `https://decorskbeauty.com/...`, `en` → `https://decorskbeauty.com/en/...`, `x-default` → the Bengali URL.
- Canonical is always self-referencing per locale.
- **Full Bengali parity. No surface may be English-only.** That includes: error pages, form validation messages, SMS, email, invoice, order status labels, admin-facing customer notifications, empty states, and the checkout terms explanation.
- Numerals: Bengali locale uses Bengali digits (০১২৩) for **display prices and dates only**. Order numbers, SKUs, phone numbers, batch codes and tracking codes stay in Latin digits in both locales, because customers copy-paste them into courier trackers and read them aloud on the phone.
- Product titles stay English in both locales. The Bengali PDP shows the English title with the Bengali short description underneath.
- Bengali copy is written natively. Do not machine-translate the English and ship it. If Bengali copy is not available for a field, leave it empty and let fallback show English rather than shipping bad Bengali.

---

## 6. Storefront

Routes (Bengali paths shown; English is the same under `/en`):

| Route | Notes |
| --- | --- |
| `/` | Home |
| `/products/[slug]` | PDP |
| `/c/[...category]` | Category, nested |
| `/b/[brand]` | Brand |
| `/search` | |
| `/routine` | Routine builder, §6.3 |
| `/verify` | Batch code verification, §6.2 |
| `/cart`, `/checkout`, `/checkout/pay/[token]` | |
| `/order/[orderNumber]` | Tracking by order number + phone, no login |
| `/account/*` | Optional, OTP login |
| `/blog`, `/blog/[slug]` | |
| `/ingredients/[slug]` | Ingredient glossary, AEO surface |
| `/pages/[slug]` | Policy pages |

### 6.1 PDP order of content (this is deliberate, do not reorder)

1. Image gallery
2. Title (EN) + brand + price
3. Variant selector
4. **The authenticity slip** (§16.4). Batch code, MFG, EXP, import lot, verify link.
5. Stock + delivery promise ("আজ অর্ডার করলে ২-৩ দিনে ঢাকায়") or pre-order ETA
6. Add to cart / Buy now / WhatsApp
7. Short description (localized)
8. Key ingredients (chips → glossary)
9. Full INCI (collapsible)
10. How to use
11. FAQ (localized, feeds FAQPage schema)
12. Reviews
13. Related + frequently bought together

Proof comes before persuasion. In this market the first objection is "is it real", not "is it good". Answering the first objection above the fold is the conversion play.

### 6.2 Batch verification (`/verify`)

Customer enters a batch code from the package. System looks up `stockLots` by `lotCode`, returns: product, MFG, EXP, import date, PO reference, and the scanned import documents. If not found, say so plainly and give the WhatsApp link, do not fake a pass.

This page is public, indexable, and linked from every PDP and every invoice. It is the moat.

### 6.3 Routine builder (`/routine`)

Bengali-first. User picks skin type + concerns. Output is an ordered 1-6 routine using `products.routineStep`, filtered by `skinTypes` and `concerns`, respecting stock. "Add all to cart" as one action. Numbering here is real information (a K-beauty routine is genuinely an ordered sequence), so numbered markers are earned, not decoration.

### 6.4 Search

Postgres native. `pg_trgm` + a `tsvector` column on `variants` built from product title, brand name, INCI, category names (both locales), SKU, and shade name.

Bengali stemming in Postgres is weak. Use the `simple` text search config plus trigram similarity, and index a **transliteration column** so `serum` matches `সিরাম` and `snail` matches `স্নেইল`. Maintain a hand-curated synonym map for the top 200 terms (brand names, product types, common misspellings like "seram", "moisturaizer"). This is faster and cheaper than adding Typesense at 1,500 SKUs.

### 6.5 Filters and sort

Filters: brand, category, skin type, concern, price range, routine step, in-stock only, on-sale only, ready-stock vs pre-order.
Sort: relevance, newest, price asc/desc, bestselling (by delivered qty, not ordered qty).

Filter state lives in the URL as query params so it is shareable and indexable-controllable. Add `noindex` to any URL with more than one active filter facet to avoid a crawl-budget swamp; canonical those back to the base category.

### 6.6 Baseline commerce features

Cart, wishlist, recently viewed, coupons, free-shipping progress bar, bundles/sets, related products, frequently-bought-together, back-in-stock SMS alerts, reviews with photo upload, **guest checkout with no forced account**, order tracking by phone + order number, invoice PDF (bilingual, Mushak-compliant per §12.4), abandoned-cart SMS, store pickup at the Banani address (free, as a delivery option).

---

## 7. Cart and checkout

Checkout is one page. Not a wizard. BD mobile conversion dies in multi-step flows.

Field order: phone → OTP → name → zone select → address → payment method → place order.

- **Phone first.** Phone is identity. On entry, look up `customers`; if found, prefill name and address after OTP.
- OTP is required before the order can be placed. This is not friction, it is the single cheapest RTO filter available.
- Zone select drives `computeCheckoutTerms`. Show the delivery charge, advance and COD amount **live** as the zone changes, with the plain-language reason ("ঢাকার বাইরে ৳২০০ অগ্রিম লাগবে").
- Payment method options render from `computeCheckoutTerms`. If the cart contains a pre-order line, COD is not shown at all, with a one-line explanation. Do not show a disabled option with no reason.
- Address: for Pathao, capture `cityId`, `zoneId`, `areaId` from the Pathao location API with a searchable Bengali-labelled combobox, plus a free-text street/landmark field. Cache the city/zone/area lists in Neon and refresh weekly by cron; do not hit Pathao's API on every keystroke.

### 7.1 Fraud check at checkout

Before the order is written, call the courier fraud/success-rate check on the phone (§9.3). Store the result on `orders.fraudCheck`.

Decision policy:

| Success ratio | COD order | Advance order |
| --- | --- | --- |
| ≥ 80% or no history | pass | pass |
| 50-79% | flag `review`, allow, surface in the order board | pass |
| < 50% | block COD, force 100% advance, show a neutral message | pass |
| Customer `blacklisted` | block entirely | pass |

Never tell the customer their fraud score. Say "এই নম্বরের জন্য অগ্রিম পেমেন্ট প্রয়োজন".

The fraud check is a **soft dependency**. If the API is slow or down, time out at 2.5s and let the order through with `decision: 'review'`. Never let a courier API outage stop a sale.

---

## 8. Payments

### 8.1 EPS

Use the `eps-payment-gateway` skill. Follow `scripts/nextjs/` exactly. Non-negotiables from that skill:

- Three calls: `GetToken` → `InitializeEPS` → `CheckMerchantTransactionStatus`.
- **Always verify via API No.3 in the success/fail/cancel handlers.** The redirect query params are unsigned and tamperable. Never update the DB from them.
- `x-hash` input changes per endpoint: `userName` for GetToken, `merchantTransactionId` for the other two.
- `merchantTransactionId` is globally unique per merchant, min 10 chars. Use `TXN-${Date.now()}-${random6}`.
- The verify response status field has aliases (`Status`, `transactionStatus`, `status`, `data.transactionStatus`, `data.status`) with mixed casing. Handle every variant per the skill's pseudocode. Do not trust the V5 PDF alone.
- `transactionTypeId: 1` (Web).
- Refunds are not in the V5 API. Handle via the EPS merchant dashboard. Record the refund as a manual journal entry and mark the order, but do not build a refund API call.

Dev uses the Public Pulse Agency **sandbox** credentials. Production uses the new Decor's merchant credentials. `EPS_MODE` switches the base URL between `sandboxpgapi.eps.com.bd` and `pgapi.eps.com.bd`. Never commit either credential set.

### 8.2 Payment purposes

| Scenario | EPS amount | Remainder |
| --- | --- | --- |
| Ready stock, Dhaka, ≤৳5,000, COD chosen | none | full COD |
| Ready stock, outside Dhaka | ৳200 advance | COD |
| Any order > ৳5,000 | 30% of grand total | COD |
| Any pre-order line present | 100% of grand total | none |
| Customer chooses full prepay | 100% | none |

Store `purpose` on the transaction. The accounting posting rules (§12.3) branch on it.

### 8.3 Idempotency

The success handler must be safe to call N times. Customer reloads happen constantly on bad connections. Key on `merchantTransactionId`: if the transaction row is already `success`, return the same result and do not re-post the journal, re-fire the Purchase event, or re-reserve stock.

---

## 9. Courier

### 9.1 Pathao (primary)

Base URL production `https://api-hermes.pathao.com`, sandbox `https://courier-api-sandbox.pathao.com`. Env: `PATHAO_CLIENT_ID`, `PATHAO_CLIENT_SECRET`, `PATHAO_USERNAME`, `PATHAO_PASSWORD`, `PATHAO_STORE_ID`.

Flow: issue token → cache it (it is long-lived, store in Neon with expiry, refresh by cron, do not re-issue per request) → create order → poll/webhook for status.

Order payload essentials: `store_id`, `merchant_order_id` (our `orderNumber`), `recipient_name`, `recipient_phone`, `recipient_address` (min 10 chars), `recipient_city`, `recipient_zone`, `recipient_area`, `delivery_type` (**48** = Normal, **12** = On Demand), `item_type` (**2** = Parcel), `item_quantity`, `item_weight` (sum of `variants.weightGrams`, in kg, minimum 0.5), `amount_to_collect` (= `orders.codAmount`, **not** grandTotal), `item_description`, `special_instruction`.

`amount_to_collect` is the single most dangerous field in this build. If an advance was paid and you send `grandTotal`, the courier collects twice and you eat the refund and the review. Assert `amount_to_collect === orders.codAmount` in a test.

Location IDs: cache `city-list`, `zone-list`, `area-list` in Neon, refresh weekly by cron.

### 9.2 Steadfast (fallback)

Base URL `https://portal.packzy.com/api/v1`. Headers `Api-Key`, `Secret-Key`. Endpoints: `create_order`, `create_order/bulk-order`, `status_by_cid/{id}`, `status_by_invoice/{invoice}`, `status_by_trackingcode/{code}`, `get_balance`.

Payload: `invoice` (our `orderNumber`), `recipient_name`, `recipient_phone`, `recipient_address`, `cod_amount` (= `orders.codAmount`), `note`, `delivery_type` (0 = home delivery, 1 = hub pickup).

Fallback triggers automatically when Pathao create-order fails twice with a 5xx, or when the destination has no Pathao area ID. Log which provider was used and why on `orders.timeline`.

### 9.3 Fraud / success-rate check

Pathao exposes a phone success-rate endpoint (POST, phone number in). That is the primary source.

**Steadfast does not have a clean public fraud API.** The community packages that offer `checkFraud()` authenticate against the merchant panel and scrape it. Do not do that: it is brittle, it breaks silently on any panel change, and it puts merchant-panel credentials in the request path.

Build `lib/integrations/fraud/index.ts` as an interface with `check(phone): Promise<FraudResult>` and these providers:

1. `pathao` — primary, real API.
2. `fraudbd` — optional aggregator covering pathao/steadfast/paperfly/redx from one key. Wire it behind `FRAUD_PROVIDER=fraudbd` if Moshiur signs up; it is a paid third party, so it stays off by default.
3. `null` — returns `{decision: 'review'}`. The default when nothing is configured.

Never let this path throw. 2.5s timeout, then `review`.

### 9.4 Status sync

Both couriers offer webhooks. Take them (`/api/courier/pathao`, `/api/courier/steadfast`), verify the bearer token, and also run a reconciling cron every 30 minutes over any order in `handedToCourier` or `inTransit` older than 2 hours since last sync. Webhooks in BD get dropped; the cron is not optional.

On `delivered`: post the delivery journal, fire the `order_delivered` custom event (§13.4), increment `customers.deliveredCount`.
On `returned`: open a `returns` row of type `rto`, reverse the sale journal, restock via a movement, increment `customers.cancelledCount`.

---

## 10. Inventory

### 10.1 FEFO allocation

`lib/inventory/allocate.ts`. Given `(variantId, qty)`, return `[{lotId, qty, landedCostPerUnit}]` picking **earliest `expDate` first**, then earliest `receivedAt` as tiebreak. Skip lots with status `quarantined` or `expired`, and skip lots inside the near-expiry block window (§10.3).

Allocation happens at **order confirmation** (after OTP + fraud check + payment where required), not at add-to-cart. Cart holds no stock. Write `reserve` movements. On ship, write `ship` movements against the same lots. On cancel/RTO, write `release` or `returnRestock`.

Reservations expire. A `pending` order older than 60 minutes with no payment releases its reservations by cron.

### 10.2 Expiry visibility

The PDP shows the EXP date of the lot that FEFO would currently ship. This is unusual and it is the point: nobody else does it, and it makes the authenticity claim checkable.

### 10.3 Near-expiry policy

| Months to EXP | Behaviour |
| --- | --- |
| > 6 | Normal |
| 3-6 | Auto-tag `shortExpiry`, show an EXP badge, eligible for a clearance discount band |
| < 3 | Blocked from normal sale. FEFO skips it. Visible only in a `/c/clearance` category with the EXP stated in the title. |
| Past EXP | `status: expired`, write off to account 5020 by cron, never sellable |

Daily cron scans and transitions lots. Email the owner a near-expiry digest weekly.

Rationale: imported K-beauty commonly lands with 12-18 months of shelf life. Without this policy the short-dated stock sits at the back and dies. With it, it converts at a discount and the write-off is a decision rather than an accident.

---

## 11. Back office

Payload admin, customised. Not a separate app.

### 11.1 Order board

Kanban by `fulfilmentStatus`. Each card shows: order number, customer name, phone, zone, grand total, COD amount, payment status, fraud decision chip, risk flags, courier chip, age.

Bulk actions from the board: confirm, print invoices, print labels, push to courier, mark packed, cancel.

### 11.2 Printing

- Invoice: A4, bilingual, Mushak-compliant (§12.4), with the batch codes of the shipped lots and the `/verify` URL.
- Label: 4×6 thermal. Order number, barcode of `orderNumber`, recipient, phone, address, COD amount in large type, item count, weight, courier logo.
- Both are server-rendered PDF, printable in batch from the order board. Do not use `window.print()` on a styled div; it breaks on every third printer.

### 11.3 Courier push

One click per order, bulk from the board. Show the exact `amount_to_collect` in the confirm dialog before push. Log the raw request and response on `orders.timeline`.

### 11.4 Stock intake

PO receive screen: scan or type `lotCode`, `mfgDate`, `expDate`, qty per line, attach import docs. Landed cost computes live and is shown before commit. On commit, lots and movements are written in one transaction. Runs in a cron-backed route if over 200 lines (§2.1).

### 11.5 Alerts

- Low stock: `variants.availableQty` below a per-variant threshold
- Near expiry: per §10.3
- Failed courier push
- Failed CAPI event (queue depth)
- EPS transaction stuck in `pending` over 30 minutes
- Order in `review` unactioned over 2 hours

Surface in an admin dashboard widget and email the owner via Resend for the first four.

### 11.6 Reports (all CSV-exportable)

Sales by day/week/month, by brand, by category, by SKU. Margin by SKU and brand (revenue minus FEFO COGS). **RTO rate by zone, by courier, by customer, by product, by acquisition campaign.** Courier performance (delivery days, RTO %, fee per parcel). Stock aging and expiry risk. Ad spend vs delivered revenue. Customer cohort retention.

The RTO-by-campaign report is the one that pays for this build. When a campaign brings orders that never deliver, the Purchase-optimised ROAS looks fine and the bank account does not.

---

## 12. Accounting

Full double-entry. Every financial event posts a balanced journal. No exceptions, no "adjustment" fields on orders.

### 12.1 Chart of accounts

| Code | Account | Type |
| --- | --- | --- |
| 1010 | Cash in hand | asset |
| 1020 | Bank | asset |
| 1030 | EPS receivable (captured, not settled) | asset |
| 1040 | Courier COD receivable | asset |
| 1050 | Inventory (at landed cost) | asset |
| 1060 | Goods in transit | asset |
| 1070 | Advance to supplier | asset |
| 1080 | VAT input / rebate | asset |
| 2010 | Accounts payable, suppliers | liability |
| 2020 | VAT payable (output) | liability |
| 2030 | **Customer advances (pre-order)** | liability |
| 2040 | AIT / TDS payable | liability |
| 3010 | Owner capital | equity |
| 3020 | Retained earnings | equity |
| 4010 | Product sales | income |
| 4020 | Delivery income | income |
| 4030 | Discounts and promotions (contra) | income |
| 4040 | Returns and refunds (contra) | income |
| 5010 | COGS, product | expense |
| 5020 | Inventory write-off (expiry/damage) | expense |
| 6010 | Courier fees | expense |
| 6020 | Payment gateway MDR | expense |
| 6030 | SMS | expense |
| 6040 | Ad spend | expense |
| 6050 | Rent | expense |
| 6060 | Salaries | expense |
| 6070 | Packaging | expense |
| 6080 | Miscellaneous | expense |

Seed this in a migration. Allow adding accounts, never renumbering.

### 12.2 Account 2030 is the one people get wrong

Pre-order money is **not revenue**. It is a liability until the goods ship. If Decor's takes ৳3 lakh of pre-order advances in Ramadan and books it as sales, the P&L lies, the VAT is wrong, and the cash looks like profit right up until the Korea shipment lands. Post advances to 2030 and release to 4010 only on ship.

### 12.3 Posting rules

| Event | Debit | Credit |
| --- | --- | --- |
| PO received into stock | 1050 Inventory (landed) | 2010 AP supplier, plus accruals for freight/duty/clearing |
| Pre-order advance received (EPS verified) | 1030 EPS receivable | 2030 Customer advances |
| Partial advance received (COD order) | 1030 EPS receivable | 2030 Customer advances |
| Ready-stock order shipped, COD | 1040 Courier COD receivable | 4010 Sales, 4020 Delivery income, 2020 VAT payable |
| Same order, cost side | 5010 COGS | 1050 Inventory |
| Order with advance shipped | 2030 Customer advances (advance portion), 1040 COD receivable (remainder) | 4010, 4020, 2020 |
| Discount applied | 4030 Discounts (contra) | reduces 4010 line |
| Courier remits COD | 1020 Bank, 6010 Courier fees | 1040 COD receivable |
| EPS settles | 1020 Bank, 6020 MDR | 1030 EPS receivable |
| RTO (shipped, not delivered) | 4040 Returns (contra), 1050 Inventory (restock at original landed cost) | 1040 COD receivable, 5010 COGS |
| RTO courier charge | 6010 Courier fees | 1040 or 1020 |
| Customer return, refunded | 4040 Returns, 1050 Inventory | 1020 Bank, 5010 COGS |
| Expiry / damage write-off | 5020 | 1050 Inventory |
| Ad spend | 6040 | 1020 Bank |

Implement in `lib/accounting/postings.ts` as one function per event returning `JournalLine[]`. The journal writer validates balance and posts. Every posting function gets a unit test asserting the entry balances and hits the right accounts.

### 12.4 VAT and invoice

**Do not hardcode a VAT rate.** The applicable rate depends on Decor's BIN registration type and whether they are registered under standard rate or trading turnover. Put `vatRatePercent` and `vatInclusive` (boolean) in the `settings` global, default to `0` and a loud admin banner saying "VAT not configured", and require Moshiur to confirm the rate and the correct Mushak form with the VAT consultant before go-live.

Invoice must carry: seller name, address, BIN, buyer name and address, invoice number and date, description, quantity, unit price, total, VAT amount, grand total, and the batch codes shipped. Build the layout to **Mushak 6.3** structure and make the form label a config value so it can be switched without a code change.

### 12.5 Reconciliation

Courier payout and EPS settlement screens: paste or upload the provider statement, match by consignment ID / merchant transaction ID, show variance, post the payout journal on accept. Unmatched rows stay in a queue. Never auto-post a payout with a variance.

### 12.6 Period close

Monthly. Blocks new postings to the closed month. Produces trial balance, P&L, balance sheet, inventory valuation, VAT summary. All CSV.

---

## 13. Marketing and measurement

This section is the difference between a website and a business. Build it exactly.

### 13.1 The identity spine

`variants.sku` is the same string in all four places:

```
variants.sku  ===  Meta catalog  retailer_id / id
              ===  Pixel         content_ids[]
              ===  CAPI          custom_data.contents[].id
              ===  Google feed   id
```

If these ever drift, Advantage+ Catalog Ads silently stop attributing and nobody notices for a month. Write a cron that samples the live feed against the Pixel payloads and alerts on mismatch.

### 13.2 Catalog feeds

| Route | Content |
| --- | --- |
| `/api/feed/meta.xml` | Primary Meta feed, RSS 2.0, English |
| `/api/feed/meta.bn.xml` | Meta **language override feed**, `bn_BD` |
| `/api/feed/google.xml` | Google Merchant Center |

Fields: `id` (=sku), `item_group_id` (=product.slug), `title`, `description`, `availability` (`in stock` | `out of stock` | `preorder`), `availability_date` (pre-order only, = today + `preOrderLeadDays`), `condition` (`new`), `price` (`"1250.00 BDT"`), `sale_price`, `sale_price_effective_date`, `link`, `image_link`, `additional_image_link`, `brand`, `google_product_category`, `fb_product_category`, `inventory`, `custom_label_0` (skinType), `custom_label_1` (primary concern), `custom_label_2` (readyStock|preOrder), `custom_label_3` (routineStep), `custom_label_4` (margin band).

`custom_label_4` matters: band SKUs by gross margin (high/mid/low) so campaigns can bid on margin rather than revenue. Almost nobody does this and it is free.

Regenerate on a 6-hour cron and on any variant publish. Cache with `revalidateTag('feed')`.

### 13.3 Pixel + CAPI

Every event fires **twice**: browser Pixel and server CAPI, sharing one `event_id`.

| Event | When | event_id source |
| --- | --- | --- |
| `PageView` | every page | uuid per pageview |
| `ViewContent` | PDP view | server-generated, embedded in the page payload |
| `Search` | search results | uuid |
| `AddToCart` | add | uuid, stored on `carts` |
| `InitiateCheckout` | checkout page load | uuid, stored on `carts` |
| `AddPaymentInfo` | payment method chosen | uuid |
| `Purchase` | **order confirmed** (see 13.4) | `orders.orderNumber` |
| `Contact` | WhatsApp / Messenger click | uuid |
| `CompleteRegistration` | OTP verified, first order | uuid |
| `Lead` | back-in-stock subscribe | uuid |

Rules, all of which are load-bearing:

- `event_id` is a **string**, case-sensitive, and must be byte-identical between Pixel and CAPI. `"DKB-2607-00042"` in both, not `"42"` in one.
- The server generates the id and hands it to the client. Never generate independently on both sides.
- CAPI must fire within minutes of the Pixel. The dedup window is 48 hours but drift kills match rates.
- CAPI endpoint: `https://graph.facebook.com/{META_GRAPH_VERSION}/{META_DATASET_ID}/events`. **Pin `META_GRAPH_VERSION` as an env var and set it to the current stable version at build time. Do not hardcode a version from memory; check Meta's changelog.**
- `user_data`: SHA-256 hash `em`, `ph` (E.164, no `+`, so `8801712113032`), `fn`, `ln`, `ct`, `st`, `zp`, `country`, `external_id` (= customer id). Do **not** hash `fbp`, `fbc`, `client_ip_address`, `client_user_agent`.
- Read `fbp`/`fbc` from `orders.attribution`, not from cookies (§4.3).
- `action_source: 'website'`.
- Use `test_event_code` in dev only. Assert it is absent in production builds.
- Targets: dedup rate > 90%, Event Match Quality > 8.0 overall and > 8.8 on Purchase. Build an admin widget that shows current EMQ pulled from the Marketing API so nobody has to remember to check Events Manager.

CAPI delivery must be queued and retried, not fire-and-forget inside the request. Write the event to a `capiQueue` table, drain it in a 1-minute cron with exponential backoff, alert on queue depth > 50.

### 13.4 When Purchase fires (chief's call, do not change without asking)

Fire `Purchase` at **order confirmation**: after OTP verified, after fraud check returns, after EPS verification where advance is required. Not at raw form submit.

Rationale: firing on form submit feeds Meta every junk order, every fat-fingered phone number, every bot. The algorithm then optimises to find more people who submit forms and never take delivery. Filtering the signal at confirmation costs a few seconds of latency and buys a materially cleaner optimisation target.

Then fire a **custom `order_delivered` event** at delivery confirmation with the true value. Optimise campaigns on `Purchase`. Report real ROAS on `order_delivered`. The gap between the two is the RTO rate, and it is the number Moshiur should be looking at every Monday.

### 13.5 Facebook / Instagram in-app browser

This is the highest-value engineering problem in the build. Most BD stores lose money here silently.

Detect server-side from the UA header and client-side: `FBAN`, `FBAV`, `FB_IAB`, `FBIOS`, `Instagram`.

Problems inside the webview: the EPS redirect chain (our site → `pg.eps.com.bd` → bKash/card 3DS → back) frequently breaks; cookies can be lost across the hop; `window.open` behaviour is inconsistent; storage is partially isolated.

Handling:

1. **COD works fully in-app.** No interstitial, no friction. This is the default and it covers most orders.
2. **If the user picks EPS while in-app**, do not redirect. Mint a short-lived signed **resume token** (JWT, 15 min, contains cart id + order draft id) and show an interstitial offering:
   - Android: `intent://decorskbeauty.com/checkout/pay/{token}#Intent;scheme=https;package=com.android.chrome;end`
   - iOS: `x-safari-https://decorskbeauty.com/checkout/pay/{token}`
   - Universal fallback: a copy-link button plus the plain URL in selectable text
3. `/checkout/pay/[token]` rehydrates the order **from the token and the DB, not from cookies.** The cart must survive a cold browser with zero shared state. This is the whole trick.
4. If the user declines to leave, offer COD if the order qualifies.
5. Set `riskFlags: inAppBrowser` on the order for later analysis.

Test this on a real Android phone in the real Facebook app before calling it done. An emulator will lie to you.

### 13.6 Safari / ITP

- ITP caps JS-set cookies at 7 days. `_fbp` written by the Pixel dies. Mitigation: capture `fbclid` from the landing URL server-side, construct `fbc` as `fb.1.{unixMs}.{fbclid}`, write it to a first-party HttpOnly cookie **and persist it on `carts.attribution`**, then carry it to `orders.attribution`. The DB is the durable store, the cookie is a convenience.
- Use `dvh` not `vh` (iOS Safari toolbar collapse).
- Avoid `position: fixed` inside scroll containers on iOS.
- Test `backdrop-filter` on real Safari or drop it.
- `-webkit-tap-highlight-color` set explicitly.
- Never rely on `sessionStorage` for anything a payment depends on.

### 13.7 Chat and social

- WhatsApp CTA: `https://wa.me/8801712113032?text={prefilled with product title and SKU}`. On PDP, cart, and a floating button. Fires `Contact`.
- Messenger link to the FB page, same treatment.
- Open Graph and Twitter cards on every PDP with the product image, title, price, and availability.
- Product tagging on Instagram/Facebook requires the catalog to be approved first. The feed in §13.2 is the prerequisite.

### 13.8 Analytics

GA4 alongside, sharing the same `event_id` discipline. Server-side GA4 Measurement Protocol for `purchase` mirrors the CAPI pattern. Do not add a tag manager: at this scale it is a performance tax and another thing that breaks in the FB webview.

---

## 14. SEO and AEO

The competitors rank because they are old, not because they are good. Beat them on structure and Bengali depth.

### 14.1 Technical

- `hreflang` per §5. `x-default` → Bengali.
- Self-referencing canonical per locale.
- `sitemap-index.xml` → `sitemap-products.xml`, `-categories`, `-brands`, `-posts`, `-ingredients`, `-static`. Both locales. Regenerate on publish.
- `robots.txt`: allow `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`. Disallow `/admin`, `/api`, `/checkout`, `/account`, `/cart`. The AI crawlers are an acquisition channel now, let them in.
- **IndexNow** ping on every publish and price change.
- `llms.txt` and `llms-full.txt` at the root.
- Image `alt` localized. Never empty on a product image.
- Filtered URLs with >1 facet get `noindex, follow` and canonical to the base category.
- 404s for dead SKUs → 301 to the parent category, tracked in `redirects`.

### 14.2 Structured data

| Page | Schema |
| --- | --- |
| All | `Organization`, `WebSite` + `SearchAction` |
| Home / contact | `LocalBusiness` with the Banani address, `+8801712113032`, geo, opening hours |
| All | `BreadcrumbList` |
| PDP | `Product` + `Offer` |
| PDP | `FAQPage` from `products.faq` |
| PLP | `ItemList` |
| Blog | `Article` |
| Ingredient page | `DefinedTerm` + `DefinedTermSet` |

On `Product`/`Offer`, include `priceCurrency: "BDT"`, `availability`, **`shippingDetails`** (with the real ৳80/৳110/৳140 zones and the ৳4,999 free threshold) and **`hasMerchantReturnPolicy`**. These two properties are what earn the shipping and returns annotations in Google's free product listings. Every competitor omits them.

`AggregateRating` renders **only when `reviews` has at least one approved row**. Emitting a fake or empty rating is a manual action waiting to happen. No exceptions, no "seed reviews".

### 14.3 AEO

The question a Bangladeshi buyer asks an assistant is not "buy korean serum". It is "শুষ্ক ত্বকের জন্য কোন কোরিয়ান সিরাম ভালো" or "নিয়াসিনামাইড কি দাগ কমায়".

- Ingredient glossary at `/ingredients/[slug]`, Bengali-first, `DefinedTerm` schema, one clear definitional answer in the first 40 words.
- Every PDP FAQ block answers real purchase objections in Bengali: authenticity, expiry, skin-type fit, delivery time, return policy.
- Answer-shaped H2s. "কতদিনে ডেলিভারি হবে?" not "Shipping Information".
- Blog: routine guides, ingredient explainers, brand comparisons, "কোরিয়ান স্কিন কেয়ার রুটিন ধাপে ধাপে". Bilingual, Bengali written natively.
- Quality gate before publish: minimum 3 FAQ entries per PDP, no unanswered heading, no machine-translated Bengali.

---

## 15. Performance and browser compatibility

### 15.1 Budgets (fail the build if exceeded)

| Metric | Target | Measured on |
| --- | --- | --- |
| LCP | < 2.0s | Moto G Power, 4G throttled, Dhaka |
| INP | < 200ms | same |
| CLS | < 0.05 | same |
| JS on PDP | < 140KB gzipped | |
| Fonts | < 120KB total | |

Run Lighthouse CI on PDP, PLP, home and checkout in the pipeline. Regression fails the PR.

### 15.2 Fonts

Self-host via `next/font/local`. **Subset aggressively** with `pyftsubset`: the Bengali unicode range only (U+0980-09FF plus the punctuation and digits actually used). A full Bengali face is 200KB+ and it will eat the entire budget. Target under 60KB for the Bengali face.

Latin and Bengali faces must load in one pass. `font-display: swap` with a matched fallback metric to keep CLS at zero.

### 15.3 Rendering

- PDP and PLP: ISR, revalidated by tag from Payload `afterChange` hooks. Never SSR a product page on demand.
- Cart and checkout: dynamic, but the cart is read from a cookie + server component. No client-side hydration blocking first paint.
- `next/image` with AVIF then WebP, correct `sizes`, `priority` on the PDP hero only, blur placeholder from a stored `blurDataURL`.

### 15.4 Image cost warning

1,500 SKUs × 5 images = ~7,500 source images. Vercel's image optimization is billed per transformation and this will get expensive fast.

Mitigation: pre-optimize on upload. A Payload `afterChange` hook on `media` generates the responsive set (400/800/1200 in AVIF + WebP) once, stores them in Vercel Blob, and the storefront serves those URLs directly with `unoptimized`. One transform per image ever, not one per viewport per visitor.

Source images: max 1,200px on the long edge, quality 72, white background, consistent framing.

### 15.5 Mobile

Mobile-first, not mobile-adapted. Design at 360px and scale up. Touch targets ≥ 44px. No hover-only affordances. Bottom sheet for variant selection, not a modal. Sticky add-to-cart bar on PDP scroll.

---

## 16. Brand and design system

No logo or brand assets exist. Define them.

### 16.1 The brief

Concrete subject: an importer's shelf of Korean skincare in Banani. Audience: Bangladeshi women 18-35, arriving from a Facebook ad, on Android, on 4G, who have been burned by a fake before. The page's single job: prove the product is real, then sell it.

The templated answer for K-beauty is a peach-pink pastel gradient, rounded pills, blob shapes, "glow" language, Poppins. Every competitor in the search results above is some version of that. It is not a choice, it is a default, and it reads as exactly the kind of site that sells fakes.

The distinctive direction comes from the subject's own artifacts: the Korean pharmacy shelf, the import sticker, the customs stamp, the batch code, the MFG/EXP stamp on the carton crimp. Clinical, gridded, information-dense, evidential. Goryeo celadon rather than candy pink, because it is Korean rather than generically feminine.

### 16.2 Tokens

Color (6 values, no others):

```
--paper       #F2F4F1   /* cool pharmacy-shelf paper, not cream */
--ink         #14181A   /* cool near-black, all body text */
--celadon     #7FA893   /* Goryeo celadon, primary accent */
--celadon-deep #2F5D4A  /* headers, seals, active states */
--seal        #C0362C   /* stamp red. RATIONED. Only the authenticity seal and expiry warnings. Nothing else. */
--grey        #8E958F   /* meta, dividers, disabled */
```

Type (3 roles):

| Role | Face | Why |
| --- | --- | --- |
| Display + UI, Bengali | **Anek Bangla** (variable, width + weight axes) | |
| Display + UI, Latin | **Anek Latin** | Same designer, same skeleton, same axes as Anek Bangla. A bilingual site where the two scripts share a spine reads as one voice instead of two fonts bolted together. This is the reason for the choice. |
| Data / evidential | **Martian Mono** | Batch codes, EXP dates, SKUs, prices, order numbers, tracking codes. The lab-slip voice. |

Fallback for Bengali: Hind Siliguri.

Layout: a strict 4pt grid, hairline rules in `--grey`, zero-radius on evidential elements (the slip, badges, tables) and 4px radius on interactive controls. Dense over airy. This is a pharmacy shelf, not a spa.

### 16.3 Motion

One orchestrated moment, not scattered effects: the authenticity slip stamps in on PDP load (a 180ms scale-and-settle on the seal, once, `prefers-reduced-motion` respected). Everything else is instant. On a 4G Dhaka connection, animation is a tax.

### 16.4 The signature: the authenticity slip

The single element this site is remembered by. On every PDP, above the fold, below the price:

```
┌─────────────────────────────────────────┐
│  ব্যাচ যাচাই                      ⟨SEAL⟩ │
│  ─────────────────────────────────────  │
│  LOT      SNP24K0917B                   │
│  MFG      2024-09-17                    │
│  EXP      2027-09-16                    │
│  IMPORT   2026-03-04  ·  PO-2603-011    │
│  ─────────────────────────────────────  │
│  এই ব্যাচ যাচাই করুন →                    │
└─────────────────────────────────────────┘
```

Martian Mono for the data. `--seal` red for the stamp only. Tappable, opens `/verify` prefilled. It also prints on the invoice.

This is the entire brand argument compressed into one component: not a claim, a receipt.

### 16.5 The risk being taken

Proof above persuasion on the PDP (§6.1), and a clinical palette in a category that is uniformly pastel. Justified because the category's actual conversion blocker in Bangladesh is trust, not desire. Every competitor is optimising for desire in a market where desire is already saturated and trust is not.

### 16.6 Voice

Bengali, plain, no marketing inflation. Active verbs. "অর্ডার করুন" not "এখনই সংগ্রহ করুন"। Errors say what happened and how to fix it. Empty states invite an action. The button that says "অর্ডার নিশ্চিত করুন" produces a confirmation that says "অর্ডার নিশ্চিত হয়েছে"।

---

## 17. Auth and notifications

### 17.1 Customer auth

Phone + OTP. No password. No email/password. No social login.

`customers.phone` is the identity. 6-digit OTP, 5-minute expiry, 3 attempts, then a 15-minute lock. Rate limit per phone (3/hour) and per IP (10/hour). Store hashed OTP, never plaintext.

**Guest checkout is mandatory.** OTP verifies the phone, it does not create an account the customer has to manage. Account creation is an opt-in checkbox after the order.

### 17.2 Staff auth

Payload users with the §4.6 roles. Enforce 2FA for `owner` and `accounts`.

### 17.3 SMS: Gennet

Build `lib/integrations/sms/` as a provider interface first, Gennet second:

```ts
interface SmsProvider {
  send(to: string, body: string, opts?: { unicode?: boolean }): Promise<SmsResult>
  balance?(): Promise<number>
}
```

Providers: `gennet` (default), `alpha` (sms.net.bd, `POST https://api.sms.net.bd/sendsms` with `api_key`, `msg`, `to`), `console` (dev).

> **Flag for Moshiur:** Gennet's API endpoint and parameter names are not publicly documented and did not surface in research. Pull the exact endpoint, auth scheme, parameter names, and Unicode/masking flags from the Gennet merchant panel and fill in `providers/gennet.ts`. The adapter interface means this is a 30-line file, and Alpha SMS is a drop-in fallback if Gennet's delivery or docs disappoint. Do not let this block the rest of the build.

Bengali SMS is Unicode: 70 characters per segment, not 160. Every template must be length-checked at build time and the segment count logged, because a 3-segment OTP costs 3× and nobody notices until the bill.

Masking sender ID: apply for `DecorsKB`. Note that BTRC requires promotional SMS to be in Bengali; transactional OTP and order updates are exempt but write them in Bengali anyway, per `orders.locale`.

### 17.4 SMS templates (Bengali, per `orders.locale`)

OTP, order placed, order confirmed, handed to courier + tracking code, out for delivery, delivered, RTO/cancelled, pre-order shipped from Korea, back-in-stock, abandoned cart (1h and 24h).

### 17.5 Email (Resend)

Order confirmation with invoice PDF, shipping notification, delivery confirmation, review request (7 days post-delivery), pre-order status updates. Bilingual per `orders.locale`. Email is secondary in BD; SMS is the channel that gets read. Do not gate anything important on email.

---

## 18. Environment variables

```bash
# Core
NEXT_PUBLIC_SITE_URL=https://decorskbeauty.com
PAYLOAD_SECRET=
DATABASE_URL=                      # Neon POOLED connection string (-pooler host)
BLOB_READ_WRITE_TOKEN=

# EPS  (sandbox creds in dev, Decor's production creds in prod)
EPS_MODE=sandbox
EPS_MERCHANT_ID=
EPS_STORE_ID=
EPS_USERNAME=
EPS_PASSWORD=
EPS_HASH_KEY=
EPS_SUCCESS_URL=https://decorskbeauty.com/api/payments/eps/success
EPS_FAIL_URL=https://decorskbeauty.com/api/payments/eps/fail
EPS_CANCEL_URL=https://decorskbeauty.com/api/payments/eps/cancel

# Pathao
PATHAO_BASE_URL=https://api-hermes.pathao.com
PATHAO_CLIENT_ID=
PATHAO_CLIENT_SECRET=
PATHAO_USERNAME=
PATHAO_PASSWORD=
PATHAO_STORE_ID=

# Steadfast
STEADFAST_BASE_URL=https://portal.packzy.com/api/v1
STEADFAST_API_KEY=
STEADFAST_SECRET_KEY=
STEADFAST_WEBHOOK_TOKEN=

# Fraud
FRAUD_PROVIDER=pathao              # pathao | fraudbd | null
FRAUDBD_API_KEY=

# Meta
NEXT_PUBLIC_META_PIXEL_ID=
META_DATASET_ID=
META_CAPI_ACCESS_TOKEN=
META_GRAPH_VERSION=                # pin current stable, check Meta changelog
META_TEST_EVENT_CODE=              # dev only, must be empty in prod
META_CATALOG_ID=

# SMS
SMS_PROVIDER=gennet
GENNET_API_KEY=
GENNET_SENDER_ID=DecorsKB
GENNET_BASE_URL=
ALPHA_SMS_API_KEY=                 # fallback

# Email
RESEND_API_KEY=
RESEND_FROM=orders@decorskbeauty.com

# Security
JWT_SECRET=                        # resume tokens
CRON_SECRET=

# Analytics
NEXT_PUBLIC_GA4_ID=
GA4_API_SECRET=
```

Nothing in this list is ever committed. `.env.example` carries the keys with empty values only.

---

## 19. Build phases

Ship in this order. Each phase ends green: tests pass, `tsc` clean, build clean, deployed to a Vercel preview, and a JOURNEY entry written.

| Phase | Scope | Done when |
| --- | --- | --- |
| **0. Foundation** | Repo, Payload 3 + Next + Neon pooled + Vercel Blob, CI, Lighthouse CI, design tokens, fonts subset, CLAUDE.md, JOURNEY.md | Admin loads, `/` renders, budgets pass on an empty page |
| **1. Catalog** | brands, categories, products, variants, ingredients, media pipeline (§15.4), bilingual fields, ISR + revalidate tags | 50 real SKUs entered, PDP and PLP render in both locales, LCP < 2.0s |
| **2. Inventory** | suppliers, POs, landed cost, stockLots, stockMovements, FEFO allocator, expiry policy, authenticity slip, `/verify` | Receive a PO, see landed cost, PDP shows the FEFO lot's EXP, `/verify` resolves a real lot |
| **3. Cart + checkout** | carts, `computeCheckoutTerms` with full unit tests, OTP, address + Pathao location cache, guest checkout | Every branch of §1.1 has a passing test. This gate is hard. |
| **4. Payments** | EPS per skill, transactions, verify-on-callback, idempotency, COD path, in-app browser interstitial + resume token | Sandbox payment completes; success handler is idempotent under 5 rapid reloads; **tested on a real Android phone inside the real Facebook app** |
| **5. Fulfilment** | Order board, fraud check, Pathao push, Steadfast fallback, webhooks + reconciling cron, invoice + label PDF | An order goes from placed to delivered with `amount_to_collect === codAmount` asserted |
| **6. Measurement** | Pixel + CAPI with shared event_id, capiQueue + retry cron, attribution persistence, feeds (meta/meta.bn/google), GA4 | Events Manager shows "Browser + Server", dedup > 90%, feed validates in Commerce Manager, SKU parity cron green |
| **7. Accounting** | Chart of accounts, posting rules with tests, journal balance enforcement, reconciliation, period close, reports | Trial balance balances after 20 simulated orders including 2 RTOs, 1 pre-order, 1 write-off |
| **8. SEO/AEO** | hreflang, sitemaps, JSON-LD incl. shippingDetails + returns, IndexNow, llms.txt, ingredient glossary, blog | Rich Results Test passes on PDP; no AggregateRating without real reviews |
| **9. Hardening** | Rate limits, RBAC field-level audit, near-expiry cron, alerts, abandoned cart, backup/restore drill, load test | RBAC audit: `packer` cannot see landed cost anywhere, proven by test |
| **10. Launch** | Production EPS creds, real Meta assets, domain verify, VAT rate confirmed, DNS, monitoring | Live |

---

## 20. Acceptance criteria

The build is not done until every one of these is a passing test.

**Money**
1. `computeCheckoutTerms` covers all of §1.1 including the rule-1 vs rule-3 interaction (take the higher advance, never both).
2. `orders.codAmount` equals the courier's `amount_to_collect` on every push. Asserted in an integration test.
3. Free shipping triggers on subtotal after discount, never including delivery.
4. A cart with any pre-order line cannot produce a COD order.
5. Every journal entry balances to 2dp. A deliberately unbalanced posting is rejected by the hook.
6. Trial balance balances after a simulated month with orders, RTOs, pre-orders, a write-off, a courier payout and an EPS settlement.
7. Pre-order advances sit in 2030 and move to 4010 only on ship.
8. Posting to a closed period is rejected.

**Inventory**
9. FEFO always allocates the earliest EXP first, skipping quarantined, expired, and <3-month lots.
10. `variants.availableQty` is only ever changed by a `stockMovements` write. A direct write is impossible by construction.
11. An abandoned pending order releases its reservations within 60 minutes.
12. Restocking an RTO returns units to the original lot at the original landed cost.

**Payments**
13. The EPS success handler is idempotent under 5 rapid reloads: one journal, one Purchase event, one stock reservation.
14. DB state is never updated from redirect query params, only from a verified API No.3 response.
15. All five status-field aliases and both casings are handled.

**Browsers**
16. The full COD flow completes inside the real Facebook Android app.
17. The EPS resume token rehydrates a checkout in a cold Chrome with no shared cookies.
18. Checkout completes in Safari on iOS with no console errors.

**Measurement**
19. `variants.sku` is byte-identical across catalog feed `id`, Pixel `content_ids`, and CAPI `contents[].id`. Enforced by the parity cron.
20. Pixel and CAPI share `event_id` on all 10 events, verified as strings.
21. `fbc`/`fbp` on a Purchase come from `orders.attribution`, and survive a cookie wipe between landing and purchase.
22. `META_TEST_EVENT_CODE` is empty in a production build.
23. Purchase fires at confirmation, not form submit; `order_delivered` fires at delivery.

**Performance**
24. LCP < 2.0s, INP < 200ms, CLS < 0.05 on PDP, throttled 4G, mid-range Android.
25. Bengali font subset under 60KB.
26. No product image is transformed more than once, ever.

**Correctness of the brand promise**
27. Every PDP shows the EXP date of the lot FEFO would ship.
28. `/verify` resolves a real batch code to real import documents.
29. `AggregateRating` never renders without at least one approved review.
30. No surface anywhere is English-only.

---

## 21. Things to raise, not silently decide

If any of these come up during the build, stop and ask Moshiur:

- The VAT rate and correct Mushak form (§12.4). This is a tax question, not an engineering one.
- Gennet's actual API shape (§17.3).
- Whether to add `fraudbd` as a paid provider (§9.3).
- Whether Payload admin latency justifies splitting off Vercel (§2.1) once the catalog passes ~800 SKUs.
- Any request to seed reviews, fake an AggregateRating, or fire Purchase on form submit. The answer is no, but he should hear why.
