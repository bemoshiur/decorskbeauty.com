import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import nextPlugin from '@next/eslint-plugin-next'

/** Flat config. FlatCompat/next-config-via-eslintrc is broken under ESLint 9 + pnpm, so wire plugins directly. */
const eslintConfig = [
  {
    ignores: [
      '.next/',
      'node_modules/',
      'src/payload-types.ts',
      'src/payload-generated-schema.ts',
      // Payload admin is Payload's own code — lint only our storefront + lib
      'src/app/\\(payload\\)/**',
    ],
  },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^(_|ignore)' },
      ],
    },
  },
  {
    // BUILD_PROMPT §3 hard rule: the storefront must not import collections or call the
    // Payload Local API. It reads through src/lib/commerce/**. Keeps the Vercel escape hatch open.
    files: ['src/app/\\(storefront\\)/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/collections/*', '@/collections/*'],
              message:
                'Storefront must not import Payload collections directly — read through src/lib/commerce/** (BUILD_PROMPT §3).',
            },
            {
              group: ['payload', 'payload/*'],
              message:
                'Storefront must not call the Payload Local API — read through src/lib/commerce/** (BUILD_PROMPT §3).',
            },
            {
              group: ['**/payload.config', '@/payload.config', '@payload-config'],
              message:
                'Storefront must not import payload.config — read through src/lib/commerce/** (BUILD_PROMPT §3).',
            },
          ],
        },
      ],
    },
  },
]

export default eslintConfig
