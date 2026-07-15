import { getPayload } from 'payload'
import config from '@payload-config'
import path from 'path'
import { slugify } from '../src/fields/slug'

const payload = await getPayload({ config })

// ── helpers ─────────────────────────────────────────────────────────
type Lexical = ReturnType<typeof rt>
function rt(paragraphs: string[]) {
  return {
    root: {
      type: 'root' as const,
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        textFormat: 0,
        children: [
          { type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 },
        ],
      })),
    },
  }
}

async function findOrCreate(
  collection: 'brands' | 'categories' | 'ingredients',
  where: Record<string, unknown>,
  data: Record<string, unknown>,
): Promise<number> {
  const found = await payload.find({ collection, where: where as never, limit: 1, depth: 0 })
  if (found.docs[0]) return found.docs[0].id as number
  const created = await payload.create({ collection, data: data as never })
  return created.id as number
}

// ── brands ──────────────────────────────────────────────────────────
const BRANDS: Record<string, string> = {
  'The Face Shop': 'South Korea',
  COSRX: 'South Korea',
  'Beauty of Joseon': 'South Korea',
  ANUA: 'South Korea',
  '3W Clinic': 'South Korea',
  MISSHA: 'South Korea',
  'The Ordinary': 'Canada',
  RYO: 'South Korea',
  'SOME BY MI': 'South Korea',
}

// ── categories (K-beauty routine groupings) ─────────────────────────
const CATEGORIES = ['Cleansers', 'Toners', 'Essences & Serums', 'Moisturizers', 'Sunscreens', 'Haircare']

// ── ingredients (glossary / AEO seed) ───────────────────────────────
const INGREDIENTS: Record<string, string> = {
  Niacinamide: 'A form of vitamin B3 that helps fade dark spots, even skin tone and strengthen the skin barrier.',
  'Snail Secretion Filtrate': 'A hydrating, repairing filtrate that improves elasticity and helps fade marks.',
  'Salicylic Acid': 'A BHA that unclogs pores, exfoliates dead skin and helps prevent acne.',
  'Hyaluronic Acid': 'A humectant that draws and holds moisture for lasting hydration.',
  'Aloe Vera': 'A soothing, lightweight moisturiser that calms irritated or sun-exposed skin.',
  'Centella Asiatica': 'A calming botanical (cica) that soothes redness and supports skin recovery.',
  'Tea Tree': 'An oil that helps soothe blemishes and control excess oil.',
  'Rice Extract': 'Brightens, hydrates and nourishes with vitamins and antioxidants.',
  'Tranexamic Acid': 'Targets stubborn dark spots and post-blemish pigmentation.',
  Zinc: 'Helps regulate oil and calm blemish-prone skin.',
}

type P = {
  n: number
  title: string
  brand: keyof typeof BRANDS
  type: string
  step: number | null
  cat: string
  size: string
  price: number
  weight: number
  code: string
  image: string
  skin: string[]
  concerns: string[]
  ingredients: string[]
  short: string
  benefits: string[]
  how: string
}

const IMG = (name: string) => `Products/WhatsApp Image 2026-07-15 at ${name}.jpeg`

const PRODUCTS: P[] = [
  {
    n: 1, title: 'Rice Water Bright Cleansing Foam', brand: 'The Face Shop', type: 'cleanser', step: 1,
    cat: 'Cleansers', size: '150ml', price: 900, weight: 190, code: '335', image: IMG('15.27.06'),
    skin: ['normal', 'oily', 'combination', 'dry'], concerns: ['dullness'], ingredients: ['Rice Extract'],
    short: 'A rich, whipped-cream foam that lifts makeup, oil and pore-clogging grime while brightening dull skin.',
    benefits: ['Cleanses away makeup, excess oil and pore-clogging impurities', 'Brightens dull skin for a healthier look', 'Keeps the skin’s natural moisture balance'],
    how: 'Lather a small amount with water and massage onto wet skin for 30–60 seconds, then rinse with lukewarm water. Use morning and evening.',
  },
  {
    n: 2, title: 'Advanced Snail 96 Mucin Power Essence', brand: 'COSRX', type: 'essence', step: 3,
    cat: 'Essences & Serums', size: '100ml', price: 1680, weight: 160, code: '921', image: IMG('15.27.07 (1)'),
    skin: ['dry', 'combination', 'oily', 'sensitive', 'acneProne'], concerns: ['aging', 'redness', 'dullness'], ingredients: ['Snail Secretion Filtrate', 'Hyaluronic Acid'],
    short: '96% snail mucin essence that intensely hydrates, repairs and improves elasticity.',
    benefits: ['Intensely hydrates and repairs damaged skin', 'Improves elasticity and softens fine lines', 'Soothes irritation and strengthens the barrier'],
    how: 'After cleansing and toner, apply 1–2 pumps and pat until absorbed. Follow with moisturizer. Morning and evening.',
  },
  {
    n: 3, title: 'Relief Sun: Rice + Probiotics SPF50+ PA++++', brand: 'Beauty of Joseon', type: 'sunscreen', step: 6,
    cat: 'Sunscreens', size: '50ml', price: 1880, weight: 90, code: '764', image: IMG('15.27.06 (1)'),
    skin: ['normal', 'dry', 'combination', 'oily', 'sensitive'], concerns: ['dullness'], ingredients: ['Rice Extract', 'Niacinamide'],
    short: 'A lightweight rice-and-B5 daily sunscreen with no white cast.',
    benefits: ['Broad-spectrum SPF50+ PA++++ against UVA & UVB', 'Lightweight, non-greasy, no white cast', 'Hydrates and nourishes while it protects'],
    how: 'Apply generously as the final step of your morning routine, 15 minutes before sun exposure. Reapply every 2–3 hours outdoors.',
  },
  {
    n: 4, title: 'Salicylic Acid Daily Gentle Cleanser', brand: 'COSRX', type: 'cleanser', step: 1,
    cat: 'Cleansers', size: '150ml', price: 1200, weight: 190, code: '1344', image: IMG('15.27.06 (2)'),
    skin: ['oily', 'combination', 'acneProne', 'normal'], concerns: ['acne', 'pores'], ingredients: ['Salicylic Acid', 'Tea Tree'],
    short: 'A gentle 0.5% BHA cleanser that clears excess sebum and helps prevent breakouts.',
    benefits: ['Exfoliates and removes excess sebum to fight acne', 'Reduces blackheads and whiteheads', 'Cleanses away dead skin and makeup residue'],
    how: 'Lather with water and massage onto wet skin for 30–60 seconds, focusing on oily areas. Rinse with lukewarm water. If sensitive, start once daily.',
  },
  {
    n: 5, title: 'AHA/BHA Clarifying Treatment Toner', brand: 'COSRX', type: 'toner', step: 2,
    cat: 'Toners', size: '150ml', price: 1480, weight: 210, code: '559', image: IMG('15.27.07'),
    skin: ['oily', 'combination', 'acneProne', 'normal'], concerns: ['acne', 'pores', 'dullness'], ingredients: ['Salicylic Acid'],
    short: 'A daily AHA/BHA toner that gently exfoliates for smoother, clearer skin.',
    benefits: ['Gently exfoliates dead skin for a brighter look', 'Unclogs pores and reduces blackheads', 'Preps skin to absorb serums and moisturizers'],
    how: 'After cleansing, sweep over the face with a cotton pad or hands, avoiding eyes and lips. If new to exfoliating toners, start 2–3 times a week. Use sunscreen by day.',
  },
  {
    n: 6, title: 'Niacinamide 10% + TXA 4% Dark Spot Correcting Serum', brand: 'ANUA', type: 'serum', step: 4,
    cat: 'Essences & Serums', size: '30ml', price: 2250, weight: 90, code: '1758', image: IMG('15.27.07 (2)'),
    skin: ['normal', 'oily', 'combination'], concerns: ['pigmentation', 'dullness'], ingredients: ['Niacinamide', 'Tranexamic Acid'],
    short: 'A targeted serum pairing niacinamide with tranexamic acid to correct dark spots.',
    benefits: ['Fades dark spots and post-blemish marks', 'Evens skin tone', 'Supports a brighter, clearer complexion'],
    how: 'After toner, apply a few drops to clean skin and pat in. Follow with moisturizer. Use sunscreen during the day.',
  },
  {
    n: 7, title: 'Aloe Vera 98% Soothing Gel', brand: '3W Clinic', type: 'moisturizer', step: 5,
    cat: 'Moisturizers', size: '300ml', price: 800, weight: 360, code: '1760', image: IMG('15.27.08'),
    skin: ['normal', 'dry', 'combination', 'oily', 'sensitive'], concerns: ['redness'], ingredients: ['Aloe Vera'],
    short: 'A multi-use 98% aloe gel that calms and lightly hydrates skin.',
    benefits: ['Soothes and cools irritated or sun-exposed skin', 'Lightweight hydration for face and body', 'Absorbs quickly without stickiness'],
    how: 'Apply a suitable amount to face or body as needed. Can be used as a light moisturizer, after-sun gel or soothing mask.',
  },
  {
    n: 8, title: 'All Around Safe Block Aqua Sun SPF50+ PA++++', brand: 'MISSHA', type: 'sunscreen', step: 6,
    cat: 'Sunscreens', size: '50ml', price: 1300, weight: 90, code: '1349', image: IMG('15.27.08 (1)'),
    skin: ['normal', 'dry', 'combination', 'oily', 'sensitive'], concerns: [], ingredients: [],
    short: 'A watery-fresh daily sun gel with high protection and a weightless finish.',
    benefits: ['Broad-spectrum SPF50+ PA++++', 'Fresh, watery texture with no heavy feel', 'Dermatologically tested for daily wear'],
    how: 'Apply as the last step of your morning routine, 15 minutes before going out. Reapply through the day as needed.',
  },
  {
    n: 9, title: 'Niacinamide 10% + Zinc 1% Serum', brand: 'The Ordinary', type: 'serum', step: 4,
    cat: 'Essences & Serums', size: '30ml', price: 1245, weight: 90, code: '336', image: IMG('15.27.08 (2)'),
    skin: ['oily', 'combination', 'acneProne'], concerns: ['acne', 'pores', 'pigmentation'], ingredients: ['Niacinamide', 'Zinc'],
    short: 'A high-strength blemish serum that balances oil and evens tone.',
    benefits: ['Reduces the look of blemishes and congestion', 'Balances excess oil', 'Evens skin tone over time'],
    how: 'Apply a few drops to the face morning and evening before heavier creams. Avoid pairing directly with pure vitamin C.',
  },
  {
    n: 10, title: 'Hair Loss Expert Care Shampoo (for Dry Scalp)', brand: 'RYO', type: 'shampoo', step: null,
    cat: 'Haircare', size: '400ml', price: 1900, weight: 470, code: '1759', image: IMG('15.27.09'),
    skin: [], concerns: ['hairfall'], ingredients: [],
    short: 'An expert-care shampoo for thinning hair and dry scalp.',
    benefits: ['Helps strengthen hair and reduce shedding', 'Cares for a dry, sensitive scalp', 'Leaves hair clean and manageable'],
    how: 'Massage into wet scalp and hair, lather, then rinse thoroughly. Use regularly for best results.',
  },
  {
    n: 11, title: 'Hyaluronic Acid Intensive Cream', brand: 'COSRX', type: 'moisturizer', step: 5,
    cat: 'Moisturizers', size: '100g', price: 1720, weight: 200, code: '917', image: IMG('15.27.08 (3)'),
    skin: ['dry', 'normal', 'sensitive'], concerns: ['dullness'], ingredients: ['Hyaluronic Acid'],
    short: 'A deeply hydrating hyaluronic acid cream that nourishes and plumps.',
    benefits: ['Deeply moisturizes and nourishes', 'Helps plump and smooth the skin', 'Comforting for dry, tight skin'],
    how: 'As the last step of your routine, smooth an even layer over the face. Use morning and evening.',
  },
  {
    n: 12, title: 'AHA·BHA·PHA 30 Days Miracle Cream', brand: 'SOME BY MI', type: 'moisturizer', step: 5,
    cat: 'Moisturizers', size: '60g', price: 1780, weight: 130, code: '332', image: IMG('15.27.09 (1)'),
    skin: ['acneProne', 'combination', 'oily'], concerns: ['acne', 'redness'], ingredients: ['Centella Asiatica', 'Tea Tree'],
    short: 'A cica-rich gel cream with mild AHA·BHA·PHA to clarify and calm blemish-prone skin.',
    benefits: ['Calms blemish-prone, troubled skin', 'Lightly resurfaces with AHA·BHA·PHA', 'Hydrates with 70% Centella Asiatica'],
    how: 'Apply an even layer as the final step of your routine, morning and evening. Introduce gradually if your skin is sensitive.',
  },
]

const ABBR: Record<string, string> = {
  'The Face Shop': 'TFS', COSRX: 'CRX', 'Beauty of Joseon': 'BOJ', ANUA: 'ANU', '3W Clinic': '3WC',
  MISSHA: 'MSH', 'The Ordinary': 'TO', RYO: 'RYO', 'SOME BY MI': 'SBM',
}

const faqFor = (p: P) => [
  {
    question: `Is this ${p.brand} product authentic?`,
    answer: 'Yes. Every unit is imported and ships from a tracked lot. The batch code, manufacture and expiry dates are printed on your parcel and verifiable with us.',
  },
  {
    question: 'How long until it expires?',
    answer: 'Korean imports usually arrive with 12–18 months of shelf life. The exact expiry is printed on your parcel — ask us before you order if you need the current lot’s date.',
  },
  {
    question: 'How is it delivered and can I pay cash?',
    answer: 'We deliver across Bangladesh in 2–3 days inside Dhaka. Cash on delivery is available for ready-stock items.',
  },
]

// ── run ─────────────────────────────────────────────────────────────
console.log('Seeding brands…')
const brandId: Record<string, number> = {}
for (const [name, country] of Object.entries(BRANDS)) {
  brandId[name] = await findOrCreate('brands', { name: { equals: name } }, { name, slug: slugify(name), countryOfOrigin: country })
}

console.log('Seeding categories…')
const catId: Record<string, number> = {}
for (const name of CATEGORIES) {
  catId[name] = await findOrCreate('categories', { name: { equals: name } }, { name, slug: slugify(name) })
}

console.log('Seeding ingredients…')
const ingId: Record<string, number> = {}
for (const [name, definition] of Object.entries(INGREDIENTS)) {
  ingId[name] = await findOrCreate('ingredients', { name: { equals: name } }, { name, slug: slugify(name), benefits: definition })
}

console.log('Seeding products + variants…')
let created = 0
let skipped = 0
for (const p of PRODUCTS) {
  const slug = slugify(p.title)
  const existing = await payload.find({ collection: 'products', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  if (existing.docs[0]) {
    skipped++
    continue
  }

  const media = await payload.create({
    collection: 'media',
    data: { alt: `${p.title} — ${p.brand}` },
    filePath: path.resolve(p.image),
  })

  const product = await payload.create({
    collection: 'products',
    data: {
      title: p.title,
      slug,
      _status: 'published',
      brand: brandId[p.brand],
      categories: [catId[p.cat]],
      keyIngredients: p.ingredients.map((i) => ingId[i]).filter(Boolean),
      shortDescription: p.short,
      description: rt([p.short, ...p.benefits]) as unknown as Lexical,
      howToUse: rt([p.how]) as unknown as Lexical,
      productType: p.type,
      routineStep: p.step ?? undefined,
      skinTypes: p.skin,
      concerns: p.concerns,
      fulfilmentMode: 'readyStock',
      images: [{ image: media.id, alt: `${p.title} — ${p.brand}` }],
      faq: faqFor(p),
    } as never,
  })

  await payload.create({
    collection: 'variants',
    data: {
      product: product.id,
      sku: `${ABBR[p.brand]}-${p.code}`,
      optionSize: p.size,
      barcode: p.code,
      mrp: p.price,
      weightGrams: p.weight,
      active: true,
    } as never,
  })
  created++
}

console.log(`Done. products created=${created} skipped=${skipped}`)
process.exit(0)
