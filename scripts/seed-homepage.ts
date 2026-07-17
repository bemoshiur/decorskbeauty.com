import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Seed a rich DEFAULT homepage + site settings so the storefront looks complete on first load and the
 * owner has a starting point to edit in the admin. Idempotent-ish: only writes the homepage layout if
 * it is currently empty, and only writes site-settings header if unset — so it never clobbers owner edits.
 * Run: pnpm payload run scripts/seed-homepage.ts
 */
const payload = await getPayload({ config })

// --- gather catalog references ---
const products = await payload.find({ collection: 'products', where: { _status: { equals: 'published' } }, depth: 1, limit: 12, sort: 'title' })
const cats = await payload.find({ collection: 'categories', depth: 0, limit: 8 })
const media = await payload.find({ collection: 'media', depth: 0, limit: 20 })

const heroImageId = (() => {
  for (const p of products.docs) {
    const img = p.images?.[0]?.image
    if (img) return typeof img === 'object' ? img.id : img
  }
  return media.docs[0]?.id
})()
const promoImageId = media.docs[3]?.id ?? heroImageId

// --- flag merchandising on the first few products (best-seller / featured / badges) ---
const badges = ['bestseller', 'new', 'sale', 'none', 'none', 'bestseller'] as const
let rank = 0
for (const p of products.docs.slice(0, 8)) {
  rank += 1
  await payload.update({
    collection: 'products',
    id: p.id,
    data: {
      featuredRank: rank,
      isBestSeller: rank <= 4,
      isNew: rank === 2 || rank === 5,
      homeBadge: badges[(rank - 1) % badges.length],
    },
    overrideAccess: true,
  })
}
console.log(`flagged ${Math.min(products.docs.length, 8)} products as featured/best-seller`)

// --- flag categories for the home grid ---
const accents = ['celadon', 'sky', 'apricot', 'rose-clay', 'lilac', 'celadon'] as const
let cOrder = 0
for (const c of cats.docs.slice(0, 6)) {
  await payload.update({
    collection: 'categories',
    id: c.id,
    data: { featuredOnHome: true, homeOrder: cOrder, accent: accents[cOrder % accents.length] },
    overrideAccess: true,
  })
  cOrder += 1
}
console.log(`flagged ${Math.min(cats.docs.length, 6)} categories for the home grid`)

// --- site settings (only if header wordmark unset) ---
const ss = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true }).catch(() => null)
if (!ss?.header?.wordmark) {
  await payload.updateGlobal({
    slug: 'site-settings',
    overrideAccess: true,
    data: {
      announcementBar: {
        enabled: true,
        background: 'celadon-deep',
        messages: [
          { text: 'Free delivery over ৳4,999 · Cash on Delivery across Bangladesh' },
          { text: '100% authentic Korean beauty · verify every batch code' },
        ],
      },
      header: {
        wordmark: "Decor's K-Beauty",
        tagline: '100% authentic Korean skincare',
        searchPlaceholder: 'Search skincare, haircare…',
        primaryNav: [
          { label: 'Shop all', href: '/search' },
          { label: 'Ingredients', href: '/ingredients' },
          { label: 'Verify authenticity', href: '/verify' },
          { label: 'Track order', href: '/account' },
        ],
      },
      footer: {
        blurb: '100% authentic Korean skincare & haircare, shipped from a tracked import lot with a batch code you can verify.',
        columns: [
          { heading: 'Shop', links: [{ label: 'All products', href: '/search' }, { label: 'Ingredients', href: '/ingredients' }] },
          { heading: 'Trust', links: [{ label: 'Verify a batch', href: '/verify' }, { label: 'Track your order', href: '/account' }] },
          { heading: 'Company', links: [{ label: 'About us', href: '/' }, { label: 'Contact', href: '/account' }] },
        ],
        socials: [{ platform: 'whatsapp', url: 'https://wa.me/8801712113032' }],
        paymentMethods: ['cod', 'bkash', 'nagad'],
      },
      businessIdentity: {
        siteName: "Decor's K-Beauty",
        phone: '+8801712113032',
        whatsappNumber: '8801712113032',
        streetAddress: 'Flat B5, House 32-34, Road 7, Block C, Banani',
        locality: 'Dhaka 1212',
        aboutBlurb: "Decor's K-Beauty sells 100% authentic Korean skincare and haircare in Banani, Dhaka. Every unit ships from a tracked import lot with a verifiable batch code.",
      },
    },
  })
  console.log('seeded site-settings')
} else {
  console.log('site-settings already set — skipped')
}

// --- homepage layout (only if empty) ---
const hp = await payload.findGlobal({ slug: 'homepage', overrideAccess: true }).catch(() => null)
if (!hp?.layout?.length) {
  await payload.updateGlobal({
    slug: 'homepage',
    overrideAccess: true,
    data: {
      layout: [
        {
          blockType: 'hero',
          eyebrow: '100% Authentic K-Beauty',
          headline: 'Real Korean skincare,',
          headlineAccent: 'verified.',
          subheadline: 'Glass-skin essentials shipped from a tracked import lot — with a batch code you can verify. Cash on Delivery across Bangladesh.',
          primaryCta: { label: 'Shop all products', href: '/search' },
          secondaryCta: { label: 'Verify a batch', href: '/verify' },
          image: heroImageId,
          floatingBadges: [{ text: 'Cash on Delivery' }, { text: 'Nationwide delivery' }, { text: 'Verifiable batch code' }],
          align: 'left',
          theme: 'mesh-hero',
        },
        {
          blockType: 'trustBadges',
          badges: [
            { icon: 'shield-check', label: '100% Authentic', sub: 'Verifiable batch code' },
            { icon: 'truck', label: 'Cash on Delivery', sub: 'Pay when it arrives' },
            { icon: 'package-check', label: '2–3 day delivery', sub: 'In Dhaka' },
            { icon: 'rotate-ccw', label: 'Easy returns', sub: 'On damaged items' },
          ],
          theme: 'cloud',
        },
        {
          blockType: 'featuredProducts',
          heading: 'Featured picks',
          subheading: 'Hand-selected favourites, always genuine.',
          viewAll: { label: 'Shop all', href: '/search' },
          theme: 'paper',
        },
        {
          blockType: 'categoryGrid',
          heading: 'Shop by category',
          subheading: 'Find your routine, step by step.',
          layout: 'bento',
          theme: 'mist',
        },
        {
          blockType: 'promoBanner',
          eyebrow: 'Editor’s pick',
          heading: 'The glass-skin routine',
          body: 'Cleanse, treat, glow. Build a complete K-beauty routine with products imported and verified for the Bangladesh market.',
          image: promoImageId,
          cta: { label: 'Explore routines', href: '/search' },
          layout: 'right',
          theme: 'mesh-bloom',
        },
        { blockType: 'bestSellers', heading: 'Best sellers', subheading: 'What Dhaka is loving right now.', theme: 'paper' },
        { blockType: 'testimonials', heading: 'Loved across Bangladesh', subheading: 'Real reviews from verified customers.', theme: 'mesh-mint' },
        {
          blockType: 'authenticity',
          eyebrow: 'Proof before persuasion',
          heading: 'Every unit is verifiably authentic',
          body: 'The K-beauty market is full of counterfeits. We ship only from tracked import lots and print a batch code on every unit — scan or type it to confirm it is genuine.',
          points: [{ text: 'Batch code on every unit' }, { text: 'Tracked import lot' }, { text: 'Scan-to-verify authenticity' }, { text: 'Sealed & genuine, always' }],
          verifyCta: { label: 'Verify a batch', href: '/verify' },
          theme: 'ink',
        },
        {
          blockType: 'cta',
          heading: 'Ready to glow?',
          subheading: 'Shop 100% authentic Korean beauty with Cash on Delivery across Bangladesh.',
          primaryCta: { label: 'Shop all products', href: '/search' },
          secondaryCta: { label: 'Order on WhatsApp', href: 'https://wa.me/8801712113032' },
          theme: 'ink',
        },
      ],
    },
  })
  console.log('seeded homepage layout')
} else {
  console.log('homepage layout already set — skipped')
}

console.log('seed complete')
process.exit(0)
