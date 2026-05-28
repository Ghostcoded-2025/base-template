import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/**/_template.*'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
})
