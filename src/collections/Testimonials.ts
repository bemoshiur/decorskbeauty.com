import type { CollectionConfig } from 'payload'

import { revalidateContentAfterChange, revalidateContentAfterDelete } from '../lib/commerce/revalidate'

/**
 * Customer testimonials = MARKETING social proof ONLY (§ redesign 2026-07-17). These are NEVER fed
 * into Product/Offer AggregateRating structured data (#12 — that must come from real approved
 * reviews). Only `approved` testimonials are ever read by the storefront.
 */
export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: { singular: 'Testimonial', plural: 'Testimonials' },
  admin: {
    group: 'Content',
    useAsTitle: 'name',
    defaultColumns: ['name', 'location', 'rating', 'approved', 'featured'],
    description: 'Social-proof quotes for the storefront. Marketing only — not used for star-rating structured data.',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterChange: [revalidateContentAfterChange],
    afterDelete: [revalidateContentAfterDelete],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'location', type: 'text', admin: { description: 'e.g. Banani, Dhaka' } },
    { name: 'avatar', type: 'upload', relationTo: 'media' },
    { name: 'rating', type: 'number', min: 1, max: 5, defaultValue: 5, admin: { description: 'Display only — never emitted as AggregateRating (#12).' } },
    { name: 'quote', type: 'textarea', required: true },
    { name: 'product', type: 'relationship', relationTo: 'products', admin: { description: 'Optional: the product this is about.' } },
    { name: 'approved', type: 'checkbox', defaultValue: false, admin: { description: 'Only approved testimonials appear on the storefront.' } },
    { name: 'featured', type: 'checkbox', defaultValue: false, admin: { description: 'Show in the homepage testimonials section.' } },
    { name: 'order', type: 'number', defaultValue: 0, admin: { description: 'Lower shows first.' } },
  ],
}
