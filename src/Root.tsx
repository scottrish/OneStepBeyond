import { lazy } from 'react'

// Split out of main.tsx: main.tsx has no exports of its own, which trips
// eslint-plugin-react-refresh's only-export-components rule when a
// component is defined inline there (see button-variants.ts for the same
// pattern applied to a different rule trigger).
const isDashboard = window.location.pathname.startsWith('/dashboard')

// index.css's `#root` rule caps width at 640px and centers it — correct
// for the mobile student app, wrong for the desktop dashboard, and both
// mount into the same #root element. Mark it here so that CSS rule can
// exclude the dashboard (see index.css's #root selector).
document.getElementById('root')?.classList.toggle('dashboard-root', isDashboard)

const Root = lazy(() =>
  isDashboard ? import('./dashboard/DashboardApp.tsx') : import('./App.tsx'),
)

export default Root
