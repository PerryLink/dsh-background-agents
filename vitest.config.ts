import { defineConfig } from 'vitest/config'
import { aliases } from './vitest.aliases.mjs'

export default defineConfig({
  resolve: {
    alias: aliases,
  },
  test: {
    include: ['tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
    environment: 'node',
    pool: 'forks',
  },
})
