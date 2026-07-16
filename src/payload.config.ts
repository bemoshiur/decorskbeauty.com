import { config as loadEnv } from 'dotenv'
// Load local env for CLI (generate:types, migrate) + tests. No-op on Vercel (platform env).
loadEnv({ path: ['.env.local', '.env'] })

import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Brands } from './collections/Brands'
import { Categories } from './collections/Categories'
import { Ingredients } from './collections/Ingredients'
import { Products } from './collections/Products'
import { Variants } from './collections/Variants'
import { Suppliers } from './collections/Suppliers'
import { PurchaseOrders } from './collections/PurchaseOrders'
import { StockLots } from './collections/StockLots'
import { StockMovements } from './collections/StockMovements'
import { Carts } from './collections/Carts'
import { OtpChallenges } from './collections/OtpChallenges'
import { Customers } from './collections/Customers'
import { Orders } from './collections/Orders'
import { Transactions } from './collections/Transactions'
import { Returns } from './collections/Returns'
import { CapiQueue } from './collections/CapiQueue'
import { Accounts } from './collections/Accounts'
import { JournalEntries } from './collections/JournalEntries'
import { JournalLines } from './collections/JournalLines'
import { FiscalPeriods } from './collections/FiscalPeriods'
import { CourierPayouts } from './collections/CourierPayouts'
import { EpsSettlements } from './collections/EpsSettlements'
import { Settings } from './globals/Settings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const isProd = process.env.NODE_ENV === 'production'
const s3Bucket = process.env.S3_BUCKET

export default buildConfig({
  // Leave serverURL undefined so Payload emits RELATIVE media URLs (/api/media/file/...), which
  // resolve against whatever origin actually serves the page (localhost / *.vercel.app / the real
  // domain). Setting it to NEXT_PUBLIC_SITE_URL (the SEO/canonical domain) hardcoded every <img> to
  // https://decorskbeauty.com — a domain not yet serving the app — so all images 404. SEO/feed URLs
  // build their own absolute URLs from NEXT_PUBLIC_SITE_URL in lib/seo, independent of this.
  serverURL: undefined,
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: " — Decor's K-Beauty",
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  // Single-locale English (i18n intentionally dropped — see JOURNEY 2026-07-15 / [[english-only-override]]).
  collections: [
    Users,
    Media,
    Brands,
    Categories,
    Ingredients,
    Products,
    Variants,
    Suppliers,
    PurchaseOrders,
    StockLots,
    StockMovements,
    Carts,
    OtpChallenges,
    Customers,
    Orders,
    Transactions,
    Returns,
    CapiQueue,
    Accounts,
    JournalEntries,
    JournalLines,
    FiscalPeriods,
    CourierPayouts,
    EpsSettlements,
  ],
  globals: [Settings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: vercelPostgresAdapter({
    // Neon POOLED connection string only (-pooler host). See CLAUDE.md / BUILD_PROMPT §2.1.
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // Never push against production — migrations only. Dev/test may push to sync schema.
    push: !isProd,
  }),
  sharp,
  plugins: [
    // S3 in every env that names a bucket (Amplify prod); falls back to Payload local disk otherwise
    // so Phase 0 / dev / tests still run. `collections: { media: true }` uses an empty key prefix, so
    // objects are keyed by the exact filename and Payload keeps emitting RELATIVE /api/media/file/<name>
    // URLs (serverURL stays undefined — see the note above; the bucket can stay private behind that
    // proxy route). Credentials come from env only when present (local CLI: migrate/seed); on Amplify
    // SSR compute, leave S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY set so the app authenticates as its own
    // least-privileged IAM principal. Pre-generated responsive set comes in Phase 1 (§15.4).
    ...(s3Bucket
      ? [
          s3Storage({
            enabled: true,
            collections: { media: true },
            bucket: s3Bucket,
            config: {
              region: process.env.S3_REGION,
              ...(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
                ? {
                    credentials: {
                      accessKeyId: process.env.S3_ACCESS_KEY_ID,
                      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
                    },
                  }
                : {}),
            },
          }),
        ]
      : []),
  ],
})
