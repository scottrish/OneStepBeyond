import path from 'node:path'
import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA phase 2, increment 2a (docs/features/pwa-phase-2-offline-v0.1.md;
    // docs/decisions/20260925-pwa-phase-2-approach.md, W1 and W4): the app
    // itself opens offline, and a new version waits for the student to
    // refresh (see src/lib/pwaUpdateStore.ts) rather than reloading under
    // them. Off in development (the plugin's default), so a stale cache
    // never hides a change while building.
    VitePWA({
      registerType: 'prompt',
      // Registered from src/main.tsx, production builds only.
      injectRegister: false,
      // Keep phase 1's public/manifest.webmanifest as it is.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        // Any address in the app (/, /dashboard, /invite?…) opens the app
        // offline. Supabase is another origin and is never cached here —
        // student data offline is increment 2b's job, from the services
        // layer (W2).
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // The Google Fonts stylesheet: use the stored copy, refresh it
            // in the background.
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            // The font files themselves never change for a given URL.
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // Lets a cloudflared/ngrok tunnel's Host header through for mobile
    // testing against the local dev server — Vite otherwise rejects any
    // Host other than localhost/127.0.0.1. Dev-only; has no effect on
    // `vite build`.
    allowedHosts: true,
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
