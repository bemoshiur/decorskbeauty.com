import { config as loadEnv } from 'dotenv'
// Load local env for CLI (generate:types, migrate) + tests. No-op on Vercel (platform env).
loadEnv({ path: ['.env.local', '.env'] })

import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const isProd = process.env.NODE_ENV === 'production'
const blobToken = process.env.BLOB_READ_WRITE_TOKEN

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
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
  collections: [Users, Media, Brands, Categories, Ingredients, Products, Variants],
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
    // Vercel Blob in every env that has a token; falls back to local disk otherwise
    // so Phase 0 (no token yet) still runs. Pre-generated responsive set comes in Phase 1 (§15.4).
    ...(blobToken
      ? [
          vercelBlobStorage({
            enabled: true,
            collections: { media: true },
            token: blobToken,
          }),
        ]
      : []),
  ],
})
