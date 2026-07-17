import type { CollectionConfig } from 'payload'

import { revalidateReviewAfterChange, revalidateReviewAfterDelete } from '../lib/commerce/revalidate'

const adminOnly = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)

/**
 * Real customer product reviews. This is the ONLY source that may feed Product/Offer AggregateRating
 * (#12/#29) — and only rows with `status: 'approved'` are ever read by the storefront or counted in the
 * rating. Never create rows here to fake social proof; testimonials (marketing) live in a separate
 * collection and never touch structured ratings.
 *
 * Trust model: anyone may `create` (customers submit from the PDP; the /api/reviews route rate-limits and
 * always forces status=pending), but only signed-in admins may `update`/`delete` (moderate). `authorPhone`
 * is private (field-level read gate) and is never included in the storefront DTO.
 */
export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'Review', plural: 'Reviews' },
  admin: {
    group: 'Catalog',
    useAsTitle: 'title',
    defaultColumns: ['product', 'rating', 'authorName', 'status', 'verifiedPurchase', 'createdAt'],
    description:
      'Real customer reviews. Only Approved reviews appear on the storefront and count toward the star rating (#12). Do not create fake reviews.',
  },
  access: {
    // Anonymous callers (incl. Payload's auto-generated REST/GraphQL) may only ever see APPROVED rows —
    // a Where clause, not `true` — so pending/rejected reviews (and their author names) are never exposed
    // before moderation (#12). Admins see all. The storefront helpers pass overrideAccess:true and already
    // filter to approved, so they are unaffected.
    read: ({ req }) => (req.user ? true : { status: { equals: 'approved' } }),
    create: () => true, // public customer submission — the API forces status=pending and rate-limits
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: {
    afterChange: [revalidateReviewAfterChange],
    afterDelete: [revalidateReviewAfterDelete],
  },
  fields: [
    { name: 'product', type: 'relationship', relationTo: 'products', required: true, index: true },
    { name: 'rating', type: 'number', required: true, min: 1, max: 5, admin: { description: '1–5 stars.' } },
    { name: 'title', type: 'text', maxLength: 120 },
    { name: 'body', type: 'textarea', required: true, maxLength: 2000 },
    { name: 'authorName', type: 'text', required: true, maxLength: 80 },
    {
      name: 'authorPhone',
      type: 'text',
      access: { read: adminOnly }, // private: never exposed to the storefront
      admin: {
        position: 'sidebar',
        description: 'Private. Matched against real orders to set Verified purchase; never shown publicly.',
      },
    },
    {
      name: 'authorIp',
      type: 'text',
      access: { read: adminOnly }, // private: submission IP, kept only for abuse rate-limiting
      admin: { position: 'sidebar', readOnly: true, description: 'Private. Submission IP (rate-limiting only).' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Pending review', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      admin: { position: 'sidebar', description: 'Only Approved is shown on the storefront.' },
    },
    {
      name: 'verifiedPurchase',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Auto-set when the phone matched a delivered/paid order for this product.',
      },
    },
    { name: 'adminNote', type: 'textarea', admin: { position: 'sidebar', description: 'Internal only.' } },
  ],
  timestamps: true,
}
