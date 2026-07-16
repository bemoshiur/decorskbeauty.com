import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

// Payload's server-only packages must not be bundled by the build. Next 16's Turbopack build
// externalizes these automatically, but we're pinned to Next 15.4 for AWS Amplify's supported SSR
// matrix, where `next build` uses webpack — and withPayload only applies these externals in
// *development* on the pre-16.1 (legacy/webpack) path. Applied here they mirror withPayload's own
// dev-mode list so the production webpack build doesn't try (and fail) to resolve optional/native
// leaf deps: `pg` (unused with the vercel-postgres driver), a second `graphql`, and pino's logger
// transport. Runtime require() resolves them all from node_modules.
const payloadServerExternals = [
  'payload',
  'pg',
  'pg-native',
  'graphql',
  'pino',
  'pino-pretty',
  'thread-stream',
  '@payloadcms/db-vercel-postgres',
  '@payloadcms/drizzle',
  '@payloadcms/graphql',
]

const nextConfig: NextConfig = {
  // Inline the (small, render-blocking) CSS into the HTML so first paint — and the web-font
  // text LCP element — isn't gated on a CSS round-trip over throttled 4G (§15.1 LCP budget).
  experimental: {
    inlineCss: true,
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  // See payloadServerExternals above — keep these out of the webpack bundle on the Next 15 build.
  serverExternalPackages: payloadServerExternals,
  webpack: (webpackConfig, { isServer }) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    if (isServer) {
      // Force require() (not bundle) for the server-only packages — mirrors withPayload's dev externals.
      webpackConfig.externals = [
        ...(Array.isArray(webpackConfig.externals) ? webpackConfig.externals : []),
        ...payloadServerExternals,
      ]
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
