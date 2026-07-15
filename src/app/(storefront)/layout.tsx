import React from 'react'
import type { Metadata } from 'next'

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
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
