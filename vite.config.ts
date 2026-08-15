import path from 'node:path'
import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Playwright's persona/e2e specs live under tests/ with their own
    // config (playwright.config.ts) — without this exclude, Vitest's
    // default file glob also picks them up and fails with a
    // "Playwright Test did not expect test.describe() to be called here"
    // parse error, since @playwright/test's test() isn't Vitest's.
    exclude: [...configDefaults.exclude, 'tests/**'],
  },
})
