# Build a PWA in two phases: installable now, offline after prototype parity

Date: 2026-09-24

## Context

CLAUDE.md's YAGNI guidance says this mobile-first web app "**may** later
become a PWA". It says not to install PWA tooling, service workers, or
Capacitor speculatively, and to record a decision here if the project
moves in that direction. The product owner has now decided: **we will
build a PWA.** The open question was *when*. Should it happen now, or
after the feature specs that bring this app to parity with
`../OneStepBeyondPrototype` are implemented?

Two findings shaped the answer:

1. **The prototype is only partly a PWA.** Its `mobile-redesign` branch
   (`1ce3145`) adds `public/manifest.webmanifest` (`display:
   standalone`, name and colors), the `apple-mobile-web-app-capable` and
   `apple-mobile-web-app-status-bar-style` meta tags, `theme-color`, and
   `viewport-fit=cover`. It has **no service worker, no offline support,
   and no install prompt**. Its only icon is `favicon.ico`, which doesn't
   meet Chromium's installability requirement for 192 px and 512 px icons.
   So "parity" means matching installable-app metadata, not an offline
   app.
2. **Installability and the mobile shell are linked.** In standalone
   mode, especially on iOS, safe-area insets, status-bar overlap, and the
   fixed bottom tab bar behave differently from inside a browser tab.
   `docs/features/mobile-app-shell-and-touch-ergonomics-v0.1.md` builds
   exactly those things. They should be built and tested in the mode
   students will actually use.

## Decision

Build the PWA in two phases.

**Phase 1: installable (now, part of the mobile shell increment).**
Delivered inside `mobile-app-shell-and-touch-ergonomics-v0.1.md` §7:
- a web app manifest (`display: standalone`, `start_url`, name/short
  name, background and theme colors from the existing design tokens),
- PNG icons at 192 and 512 px, plus a maskable 512 px icon, and an
  `apple-touch-icon` at 180 px,
- `theme-color` and the Apple standalone meta tags,
- **no service worker.** Nothing is cached. Every request goes to the
  network exactly as it does today.

**Phase 2: offline and background capabilities (after prototype
parity).** Service worker, offline behavior, background sync, and push
notifications. This gets its own feature spec and its own decision
record, written once the parity feature set exists. At minimum that
spec must answer:
- which Supabase data may be cached, and for how long;
- how auth sessions and token refresh behave offline;
- what a student sees when planning data may be stale;
- how writes made offline (starting or completing a session, completing
  a step, reordering, capture) are queued, retried, and reconciled;
- how that affects what a coach or parent sees on the dashboard;
- how updates are rolled out (service-worker update flow), so a
  student is never stuck on an old bundle.

Capacitor or native wrapping stays unaddressed. It isn't part of either
phase.

## Alternatives considered

- **Full PWA now, service worker included.** Rejected. Offline support
  for a Supabase-backed app where every write matters is a real design
  problem, and its answers depend on the finished feature set. A
  caching service worker also slows the feature-building loop ahead
  (stale bundles, "my change isn't showing"), during the period of
  heaviest change.
- **Everything after parity, including the manifest.** Rejected. The
  manifest is cheap and doesn't affect architecture, and deferring it
  means the mobile shell is built without testing it standalone. That
  risks reworking safe-area and tab-bar behavior later.
- **Copy the prototype exactly (manifest with `favicon.ico` only).**
  Rejected. It doesn't meet Chromium's install criteria, so Android
  users couldn't install the app.

## Consequences

- `mobile-app-shell-and-touch-ergonomics-v0.1.md` moves the
  installable-app metadata from Out of Scope into scope (§7), with
  acceptance criteria for installability and standalone safe-area
  behavior, and one criterion that **no service worker is registered**.
- **App icons:** draft icons (any, maskable, and Apple touch) plus their
  SVG masters were added to `public/icons/` on 2026-09-24. Product must
  approve the mark before Phase 1 is accepted.
- Until Phase 2, the installed app needs a network connection, just like
  the browser version. No offline promise is made, and no copy should
  imply one.
- Keeping every data access behind `src/services/` (already required by
  CLAUDE.md) is what keeps Phase 2 additive. It remains a hard rule, and
  offline work will build on that layer rather than on components.
- CLAUDE.md's "may later become a PWA" wording is now superseded by
  this record for PWA work. Its guidance against speculative
  Capacitor/native tooling still stands.
