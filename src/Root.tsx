import { lazy } from 'react'

// Split out of main.tsx: main.tsx has no exports of its own, which trips
// eslint-plugin-react-refresh's only-export-components rule when a
// component is defined inline there (see button-variants.ts for the same
// pattern applied to a different rule trigger).
const isDashboard = window.location.pathname.startsWith('/dashboard')
// docs/features/supporter-invitation-feature-spec-v0.1.md's Implementation
// Note — the invitation link's own accept screen. This app has no
// router; the same hand-rolled pathname check as isDashboard above just
// extends to a second branch, since one more standalone screen doesn't
// justify adopting one.
const isInviteAccept = window.location.pathname.startsWith('/invite')

// index.css's `#root` rule caps width at 640px and centers it — correct
// for the mobile student app (and the invite-accept screen, which is
// just as narrow), wrong for the desktop dashboard, and all three mount
// into the same #root element. Mark it here so that CSS rule can exclude
// the dashboard (see index.css's #root selector).
document.getElementById('root')?.classList.toggle('dashboard-root', isDashboard)

const Root = lazy(() =>
  isDashboard
    ? import('./dashboard/DashboardApp.tsx')
    : isInviteAccept
      ? import('./pages/InviteAcceptPage.tsx')
      : import('./App.tsx'),
)

export default Root
