import type { SiteSetting } from '@/payload-types'
import { resolveMedia } from '@/lib/media'
import type { AnnouncementMessage } from '@/components/layout/AnnouncementBar'
import type { HeaderNavLink } from '@/components/layout/SiteHeader'
import type { FooterColumn, FooterSocial } from '@/components/layout/SiteFooter'

const WORDMARK = "Decor's K-Beauty"

/** Derive the storefront chrome props from SiteSettings, with sensible brand defaults so the shell
 *  renders correctly even before the owner has saved the global. */
export function deriveChrome(s: SiteSetting | null) {
  const header = s?.header
  const footer = s?.footer
  const identity = s?.businessIdentity
  const annc = s?.announcementBar

  const nav: HeaderNavLink[] =
    header?.primaryNav && header.primaryNav.length
      ? header.primaryNav.map((n) => ({ label: n.label, href: n.href }))
      : [
          { label: 'Shop all', href: '/search' },
          { label: 'Ingredients', href: '/ingredients' },
          { label: 'Verify authenticity', href: '/verify' },
          { label: 'Track order', href: '/account' },
        ]

  const announcementMessages: AnnouncementMessage[] =
    annc?.enabled !== false && annc?.messages?.length
      ? annc.messages.map((m) => ({ text: m.text, linkLabel: m.linkLabel, linkHref: m.linkHref }))
      : annc?.enabled === false
        ? []
        : [{ text: 'Free delivery over ৳4,999 · Cash on Delivery across Bangladesh' }]

  const columns: FooterColumn[] =
    footer?.columns && footer.columns.length
      ? footer.columns.map((c) => ({ heading: c.heading, links: (c.links ?? []).map((l) => ({ label: l.label, href: l.href })) }))
      : [
          { heading: 'Shop', links: [{ label: 'All products', href: '/search' }, { label: 'Ingredients', href: '/ingredients' }] },
          { heading: 'Trust', links: [{ label: 'Verify a batch', href: '/verify' }, { label: 'Track your order', href: '/account' }] },
          { heading: 'Contact', links: [{ label: 'WhatsApp us', href: `https://wa.me/${identity?.whatsappNumber ?? '8801712113032'}` }] },
        ]

  const socials: FooterSocial[] =
    footer?.socials && footer.socials.length
      ? footer.socials.map((s2) => ({ platform: s2.platform, url: s2.url }))
      : [{ platform: 'whatsapp', url: `https://wa.me/${identity?.whatsappNumber ?? '8801712113032'}` }]

  return {
    announcement: {
      messages: announcementMessages,
      background: annc?.background ?? 'celadon-deep',
    },
    header: {
      wordmark: header?.wordmark ?? WORDMARK,
      logoUrl: resolveMedia(header?.logo)?.url ?? null,
      nav,
    },
    footer: {
      wordmark: identity?.siteName ?? header?.wordmark ?? WORDMARK,
      blurb: footer?.blurb ?? '100% authentic Korean skincare & haircare, shipped from a tracked import lot with a batch code you can verify.',
      columns,
      socials,
      paymentMethods: (footer?.paymentMethods as string[] | undefined) ?? ['cod', 'bkash', 'nagad'],
      contact: {
        address: [identity?.streetAddress, identity?.locality].filter(Boolean).join(', ') || 'Banani, Dhaka',
        phone: identity?.phone ?? '+8801712113032',
      },
      copyright: footer?.copyright ?? null,
    },
  }
}
