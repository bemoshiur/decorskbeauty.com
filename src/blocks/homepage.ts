import type { Block, Field } from 'payload'

/**
 * Homepage layout-builder blocks (§ redesign 2026-07-17). The owner adds/reorders these Webflow-style
 * in the `Homepage` global's `layout` field. Each block maps 1:1 to a React section component in
 * src/components/home/blocks/**, rendered by the BlockRenderer. Keep field names stable — they are the
 * contract with the components and with the generated payload-types.
 */

// Brand surface options — must match the Section `surface` prop + globals.css classes.
const THEME_OPTIONS = [
  { label: 'Paper (plain)', value: 'paper' },
  { label: 'Cloud (raised)', value: 'cloud' },
  { label: 'Mist (subtle)', value: 'mist' },
  { label: 'Aurora (celadon·sky·apricot)', value: 'mesh-hero' },
  { label: 'Mint (celadon·sky)', value: 'mesh-mint' },
  { label: 'Bloom (apricot·rose)', value: 'mesh-bloom' },
  { label: 'Ink (deep green)', value: 'ink' },
]

const themeField = (defaultValue = 'paper'): Field => ({
  name: 'theme',
  type: 'select',
  defaultValue,
  options: THEME_OPTIONS,
  admin: { description: 'Background treatment for this section.' },
})

// A reusable call-to-action (label + link). href accepts a path (/search) or full URL.
const ctaField = (name: string, label: string): Field => ({
  name,
  type: 'group',
  label,
  fields: [
    { name: 'label', type: 'text' },
    { name: 'href', type: 'text', admin: { description: 'e.g. /search, /products/slug, https://wa.me/...' } },
  ],
})

// Curated icon set (mapped to lucide-react in the component).
const ICON_OPTIONS = [
  'shield-check', 'badge-check', 'truck', 'rotate-ccw', 'headphones',
  'sparkles', 'leaf', 'lock', 'star', 'heart', 'package-check', 'phone',
].map((v) => ({ label: v, value: v }))

export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    { name: 'eyebrow', type: 'text', admin: { description: 'Small label above the headline.' } },
    { name: 'headline', type: 'text', required: true },
    { name: 'headlineAccent', type: 'text', admin: { description: 'Word(s) to render in the gradient accent.' } },
    { name: 'subheadline', type: 'textarea' },
    ctaField('primaryCta', 'Primary CTA'),
    ctaField('secondaryCta', 'Secondary CTA'),
    { name: 'image', type: 'upload', relationTo: 'media', admin: { description: 'Hero visual (product / lifestyle).' } },
    { name: 'floatingBadges', type: 'array', maxRows: 3, labels: { singular: 'Badge', plural: 'Badges' }, fields: [{ name: 'text', type: 'text' }] },
    { name: 'align', type: 'select', defaultValue: 'left', options: [{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }] },
    themeField('mesh-hero'),
  ],
}

export const TrustBadgesBlock: Block = {
  slug: 'trustBadges',
  interfaceName: 'TrustBadgesBlock',
  labels: { singular: 'Trust strip', plural: 'Trust strips' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'badges',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      fields: [
        { name: 'icon', type: 'select', defaultValue: 'shield-check', options: ICON_OPTIONS },
        { name: 'label', type: 'text', required: true },
        { name: 'sub', type: 'text' },
      ],
    },
    themeField('cloud'),
  ],
}

export const FeaturedProductsBlock: Block = {
  slug: 'featuredProducts',
  interfaceName: 'FeaturedProductsBlock',
  labels: { singular: 'Featured products', plural: 'Featured products' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Featured' },
    { name: 'subheading', type: 'textarea' },
    { name: 'products', type: 'relationship', relationTo: 'products', hasMany: true, admin: { description: 'Curated + ordered. Leave empty to auto-fill from featured/best-seller flags.' } },
    ctaField('viewAll', 'View-all link'),
    themeField('paper'),
  ],
}

export const CategoryGridBlock: Block = {
  slug: 'categoryGrid',
  interfaceName: 'CategoryGridBlock',
  labels: { singular: 'Category grid', plural: 'Category grids' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Shop by category' },
    { name: 'subheading', type: 'textarea' },
    { name: 'categories', type: 'relationship', relationTo: 'categories', hasMany: true, admin: { description: 'Leave empty to auto-fill from categories flagged "featured on home".' } },
    { name: 'layout', type: 'select', defaultValue: 'bento', options: [{ label: 'Bento', value: 'bento' }, { label: 'Even grid', value: 'grid' }] },
    themeField('mist'),
  ],
}

export const PromoBannerBlock: Block = {
  slug: 'promoBanner',
  interfaceName: 'PromoBannerBlock',
  labels: { singular: 'Promo banner', plural: 'Promo banners' },
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    ctaField('cta', 'CTA'),
    { name: 'layout', type: 'select', defaultValue: 'left', options: [{ label: 'Image left', value: 'left' }, { label: 'Image right', value: 'right' }, { label: 'Full-bleed', value: 'full' }] },
    themeField('mesh-bloom'),
    { name: 'startAt', type: 'date', admin: { description: 'Optional: show from this time.' } },
    { name: 'endAt', type: 'date', admin: { description: 'Optional: hide after this time.' } },
  ],
}

export const BestSellersBlock: Block = {
  slug: 'bestSellers',
  interfaceName: 'BestSellersBlock',
  labels: { singular: 'Best sellers', plural: 'Best sellers' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Best sellers' },
    { name: 'subheading', type: 'textarea' },
    { name: 'products', type: 'relationship', relationTo: 'products', hasMany: true, admin: { description: 'Leave empty to auto-fill from the "best seller" flag.' } },
    themeField('paper'),
  ],
}

export const TestimonialsBlock: Block = {
  slug: 'testimonials',
  interfaceName: 'TestimonialsBlock',
  labels: { singular: 'Testimonials', plural: 'Testimonials' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Loved in Dhaka' },
    { name: 'subheading', type: 'textarea' },
    themeField('mesh-mint'),
    // Cards are pulled from approved+featured Testimonials (never from Product ratings — #12).
  ],
}

export const AuthenticityBlock: Block = {
  slug: 'authenticity',
  interfaceName: 'AuthenticityBlock',
  labels: { singular: 'Authenticity', plural: 'Authenticity' },
  fields: [
    { name: 'eyebrow', type: 'text', defaultValue: 'Proof before persuasion' },
    { name: 'heading', type: 'text', defaultValue: 'Every unit is verifiably authentic' },
    { name: 'body', type: 'textarea' },
    { name: 'points', type: 'array', maxRows: 5, fields: [{ name: 'text', type: 'text', required: true }] },
    { name: 'image', type: 'upload', relationTo: 'media' },
    ctaField('verifyCta', 'Verify CTA'),
    themeField('ink'),
  ],
}

export const RichTextBlock: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  labels: { singular: 'Rich text', plural: 'Rich text' },
  fields: [
    { name: 'content', type: 'richText' },
    { name: 'align', type: 'select', defaultValue: 'center', options: [{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }] },
    themeField('paper'),
  ],
}

export const NewsletterBlock: Block = {
  slug: 'newsletter',
  interfaceName: 'NewsletterBlock',
  labels: { singular: 'Newsletter', plural: 'Newsletters' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Skincare notes, no spam' },
    { name: 'subheading', type: 'textarea' },
    { name: 'placeholder', type: 'text', defaultValue: 'Your phone or email' },
    { name: 'ctaLabel', type: 'text', defaultValue: 'Keep me posted' },
    themeField('mesh-bloom'),
  ],
}

export const CtaBlock: Block = {
  slug: 'cta',
  interfaceName: 'CtaBlock',
  labels: { singular: 'CTA band', plural: 'CTA bands' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'subheading', type: 'textarea' },
    ctaField('primaryCta', 'Primary CTA'),
    ctaField('secondaryCta', 'Secondary CTA'),
    themeField('ink'),
  ],
}

/** The ordered set offered in the Homepage layout builder. */
export const homepageBlocks: Block[] = [
  HeroBlock,
  TrustBadgesBlock,
  FeaturedProductsBlock,
  CategoryGridBlock,
  PromoBannerBlock,
  BestSellersBlock,
  TestimonialsBlock,
  AuthenticityBlock,
  RichTextBlock,
  NewsletterBlock,
  CtaBlock,
]
