import React from 'react'
import type { Metadata } from 'next'

import { Analytics } from '@/components/Analytics'
import { JsonLd } from '@/components/JsonLd'
import { graph, organization, website } from '@/lib/seo/jsonld'
import { getSiteSettings } from '@/lib/commerce'
import { deriveChrome } from '@/lib/siteChrome'
import { MotionProvider } from '@/components/motion/MotionProvider'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { WhatsAppFab } from '@/components/store/WhatsAppFab'
import { GeistSans, GeistMono, fraunces } from './fonts'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://decorskbeauty.com'),
  title: {
    default: "Decor's K-Beauty — 100% Authentic Korean Skincare & Haircare",
    template: "%s — Decor's K-Beauty",
  },
  description:
    'Authentic Korean skincare and haircare in Banani, Dhaka. Every unit ships from a tracked import lot with a verifiable batch code.',
  // Social share previews (Facebook/Messenger/WhatsApp — the dominant BD channels). Image URLs
  // resolve against metadataBase, so rich previews light up once decorskbeauty.com points at the app.
  openGraph: {
    type: 'website',
    siteName: "Decor's K-Beauty",
    locale: 'en_US',
    url: '/',
    title: "Decor's K-Beauty — 100% Authentic Korean Skincare & Haircare",
    description:
      '100% authentic Korean skincare & haircare, delivered across Bangladesh with Cash on Delivery. Every unit has a verifiable batch code.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: "Decor's K-Beauty" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Decor's K-Beauty — 100% Authentic Korean Skincare & Haircare",
    description: '100% authentic Korean skincare & haircare, delivered across Bangladesh with Cash on Delivery.',
    images: ['/og.png'],
  },
}

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  const chrome = deriveChrome(settings)
  const whatsapp = settings?.businessIdentity?.whatsappNumber ?? '8801712113032'

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${fraunces.variable}`}>
      <body className="flex min-h-[100dvh] flex-col bg-paper text-ink antialiased">
        <JsonLd data={graph(organization(), website())} />
        <Analytics />
        <MotionProvider>
          <AnnouncementBar messages={chrome.announcement.messages} background={chrome.announcement.background} />
          <SiteHeader wordmark={chrome.header.wordmark} logoUrl={chrome.header.logoUrl} nav={chrome.header.nav} />
          <main className="flex-1">{children}</main>
          <SiteFooter {...chrome.footer} />
          <WhatsAppFab phone={whatsapp} message="Hi, I'd like to order from Decor's K-Beauty." />
        </MotionProvider>
      </body>
    </html>
  )
}
