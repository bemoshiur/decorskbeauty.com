import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { Navbar } from '@/components/commerce/navbar'
import { Analytics } from '@/components/Analytics'
import { JsonLd } from '@/components/JsonLd'
import { graph, organization, website } from '@/lib/seo/jsonld'
import { GeistSans, GeistMono } from './fonts'
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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="flex min-h-[100dvh] flex-col bg-white text-black selection:bg-blue-600 selection:text-white dark:bg-black dark:text-white">
        <JsonLd data={graph(organization(), website())} />
        <Analytics />
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-neutral-200 dark:border-neutral-800">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-4">
              <Link href="/" className="hover:text-black dark:hover:text-white">Home</Link>
              <Link href="/search" className="hover:text-black dark:hover:text-white">All</Link>
              <Link href="/ingredients" className="hover:text-black dark:hover:text-white">Ingredients</Link>
              <Link href="/verify" className="hover:text-black dark:hover:text-white">Verify a batch</Link>
              <a href="https://wa.me/8801712113032" target="_blank" rel="noopener noreferrer" className="hover:text-black dark:hover:text-white">WhatsApp</a>
            </div>
            <p>© {new Date().getFullYear().toString()} Decor&apos;s K-Beauty · Banani, Dhaka · +8801712113032</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
