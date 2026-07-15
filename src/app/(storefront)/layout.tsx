import React from 'react'
import type { Metadata } from 'next'

import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Analytics } from '@/components/Analytics'
import { JsonLd } from '@/components/JsonLd'
import { graph, organization, website } from '@/lib/seo/jsonld'
import { anekLatin, martianMono } from './fonts'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://decorskbeauty.com'),
  title: {
    default: "Decor's K-Beauty — 100% Authentic Korean Skincare & Haircare",
    template: "%s — Decor's K-Beauty",
  },
  description:
    'Authentic Korean skincare and haircare in Banani, Dhaka. Every unit ships from a tracked import lot with a verifiable batch code.',
}

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anekLatin.variable} ${martianMono.variable}`}>
      <body className="flex min-h-[100dvh] flex-col">
        {/* Site-wide identity graph on every page (§14.2). */}
        <JsonLd data={graph(organization(), website())} />
        <Analytics />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
