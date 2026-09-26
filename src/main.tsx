import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Root from './Root.tsx'
import { initAppearance } from './lib/appearanceStore'
import { registerServiceWorker } from './lib/registerServiceWorker'

// Light or dark, as chosen in Settings (docs/features/appearance-light-dark-v0.1.md).
initAppearance()

// Opens offline and updates safely — production builds only
// (docs/features/pwa-phase-2-offline-v0.1.md, 2a).
void registerServiceWorker(import.meta.env.PROD)

// docs/features/coach-parent-dashboard-feature-spec-v0.1.md's
// Implementation Note: the dashboard lives at its own distinct URL,
// entirely outside the mobile AppShell — no shared navigation, no router.
// A one-time pathname check at the root (see Root.tsx) is the whole
// "routing" this needs; see CLAUDE.md's "add [a router] when a feature
// needs it." Root is lazy-loaded so a build split keeps the desktop-only
// dashboard bundle out of the mobile student app's download.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Root />
    </Suspense>
  </StrictMode>,
)
