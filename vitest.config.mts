import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.ts', 'tests/unit/**/*.spec.ts'],
    // Integration tests hit a remote pooled Neon DB whose latency varies widely (serverless compute
    // wakes/throttles) — generous timeouts keep heavy multi-round-trip tests from flaking on latency.
    hookTimeout: 120000,
    testTimeout: 90000,
    // Run test files sequentially so two Payload inits don't race on CREATE TYPE for new enums.
    fileParallelism: false,
  },
})
