import type { GlobalConfig } from 'payload'

import { revalidateContentGlobal } from '../lib/commerce/revalidate'

/**
 * Store-wide chrome + marketing copy (§ redesign 2026-07-17): announcement bar, header/logo/nav,
 * footer, business identity, default SEO, and DISPLAY-ONLY delivery/PDP copy. Read on the storefront
 * through src/lib/commerce/content.ts::getSiteSettings (#13). This is the single source for business
 * identity (retiring the duplicated hardcoded copies in layout/jsonld/llms).
 *
 * IMPORTANT (#3): delivery COPY only — never the numeric charges. Real delivery/advance/COD amounts
 * stay in computeCheckoutTerms; copy fields interpolate those constants, never restate them.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: { group: 'Content', description: 'Header, footer, announcement bar, identity, and marketing copy.' },
  access: { read: () => true, update: ({ req }) => Boolean(req.user) },
  hooks: { afterChange: [revalidateContentGlobal] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Announcement',
          fields: [
            {
              name: 'announcementBar',
              type: 'group',
              fields: [
                { name: 'enabled', type: 'checkbox', defaultValue: true },
                {
                  name: 'messages',
                  type: 'array',
                  labels: { singular: 'Message', plural: 'Messages' },
                  admin: { description: 'Rotates through these (e.g. free-shipping threshold, hotline, offer).' },
                  fields: [
                    { name: 'text', type: 'text', required: true },
                    { name: 'linkLabel', type: 'text' },
                    { name: 'linkHref', type: 'text' },
                  ],
                },
                {
                  name: 'background',
                  type: 'select',
                  defaultValue: 'celadon-deep',
                  options: [
                    { label: 'Celadon deep', value: 'celadon-deep' },
                    { label: 'Ink', value: 'ink' },
                    { label: 'Gradient (CTA)', value: 'grad' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Header',
          fields: [
            {
              name: 'header',
              type: 'group',
              fields: [
                { name: 'logo', type: 'upload', relationTo: 'media', admin: { description: 'Optional logo image (falls back to the wordmark).' } },
                { name: 'wordmark', type: 'text', defaultValue: "Decor's K-Beauty" },
                { name: 'tagline', type: 'text', defaultValue: '100% authentic Korean skincare' },
                {
                  name: 'primaryNav',
                  type: 'array',
                  labels: { singular: 'Nav link', plural: 'Nav links' },
                  fields: [
                    { name: 'label', type: 'text', required: true },
                    { name: 'href', type: 'text', required: true },
                  ],
                },
                { name: 'searchPlaceholder', type: 'text', defaultValue: 'Search skincare, haircare…' },
              ],
            },
          ],
        },
        {
          label: 'Footer',
          fields: [
            {
              name: 'footer',
              type: 'group',
              fields: [
                { name: 'blurb', type: 'textarea', admin: { description: 'Short brand line under the wordmark.' } },
                {
                  name: 'columns',
                  type: 'array',
                  labels: { singular: 'Column', plural: 'Columns' },
                  fields: [
                    { name: 'heading', type: 'text', required: true },
                    {
                      name: 'links',
                      type: 'array',
                      fields: [
                        { name: 'label', type: 'text', required: true },
                        { name: 'href', type: 'text', required: true },
                      ],
                    },
                  ],
                },
                {
                  name: 'socials',
                  type: 'array',
                  fields: [
                    { name: 'platform', type: 'select', options: ['facebook', 'instagram', 'whatsapp', 'youtube', 'tiktok'].map((v) => ({ label: v, value: v })) },
                    { name: 'url', type: 'text', required: true },
                  ],
                },
                {
                  name: 'paymentMethods',
                  type: 'select',
                  hasMany: true,
                  defaultValue: ['cod', 'bkash', 'nagad'],
                  options: ['cod', 'bkash', 'nagad', 'rocket', 'upay', 'visa', 'mastercard'].map((v) => ({ label: v, value: v })),
                  admin: { description: 'Payment marks shown in the footer + checkout.' },
                },
                { name: 'copyright', type: 'text', admin: { description: 'Leave blank to auto-generate "© YEAR <wordmark>".' } },
              ],
            },
          ],
        },
        {
          label: 'Identity & SEO',
          fields: [
            {
              name: 'businessIdentity',
              type: 'group',
              admin: { description: 'Single source of truth for name/phone/address (feeds header, footer, JSON-LD, llms.txt).' },
              fields: [
                { name: 'siteName', type: 'text', defaultValue: "Decor's K-Beauty" },
                { name: 'phone', type: 'text', defaultValue: '+8801712113032' },
                { name: 'whatsappNumber', type: 'text', defaultValue: '8801712113032', admin: { description: 'Digits only, country code first (wa.me format).' } },
                { name: 'email', type: 'text' },
                { name: 'streetAddress', type: 'text', defaultValue: 'Flat B5, House 32-34, Road 7, Block C, Banani' },
                { name: 'locality', type: 'text', defaultValue: 'Dhaka 1212' },
                { name: 'aboutBlurb', type: 'textarea', admin: { description: 'One-paragraph description for llms.txt / meta fallback.' } },
              ],
            },
            {
              name: 'defaultSeo',
              type: 'group',
              fields: [
                { name: 'metaTitle', type: 'text' },
                { name: 'metaDescription', type: 'textarea' },
                { name: 'ogImage', type: 'upload', relationTo: 'media' },
              ],
            },
          ],
        },
        {
          label: 'Marketing copy',
          fields: [
            {
              name: 'deliveryPromise',
              type: 'group',
              admin: { description: 'DISPLAY COPY ONLY. Never the numeric charges (#3) — those come from checkout terms.' },
              fields: [
                { name: 'freeShipHeadline', type: 'text', defaultValue: 'Free delivery over ৳4,999' },
                { name: 'zoneBlurb', type: 'text', defaultValue: 'Dhaka city, sub-Dhaka & nationwide' },
                { name: 'etaCopy', type: 'text', defaultValue: '2–3 days in Dhaka, 3–5 days nationwide' },
              ],
            },
            {
              name: 'productPage',
              type: 'group',
              fields: [
                { name: 'stockPromise', type: 'text', defaultValue: 'In stock · Cash on Delivery · 2–3 days in Dhaka' },
                { name: 'preorderPromise', type: 'text', defaultValue: 'Pre-order · ships in 2–3 weeks · full payment secures your unit' },
                { name: 'authenticityCopy', type: 'textarea', defaultValue: 'Every unit ships from a tracked import lot with a batch code you can verify.' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
