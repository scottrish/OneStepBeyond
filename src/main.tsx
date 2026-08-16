import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Root from './Root.tsx'

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
