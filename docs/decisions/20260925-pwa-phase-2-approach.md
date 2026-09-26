# PWA phase 2: how the app works offline and stays up to date

Date: 2026-09-25

## Context

`20260924-pwa-in-two-phases.md` put phase 2 (service worker, offline,
background sync, push) after prototype parity, and required its own
spec and decision record. Parity (roadmap Phase 7 steps 1–12) is built.
`pwa-phase-2-offline-v0.1.md` answers that record's six questions and
split the work into four increments. The product owner settled its five
decisions on 2026-09-25.

## Decision

1. **W1 — `vite-plugin-pwa` (Workbox).** It precaches the built app in
   version-stamped caches, generates the service worker, and handles
   updates. This lifts CLAUDE.md's hold on "a PWA build plugin", for
   phase 2 only. The service worker is off in development.
2. **W2 — offline data lives in IndexedDB, owned by `src/services/`.**
   It holds the last copy of what the offline screens read, per student,
   for 7 days, and is cleared on sign-out or when a different student
   signs in. The service worker does **not** cache Supabase responses:
   those depend on who's signed in, and the app couldn't then say
   honestly how old its data is.
3. **W3 — offline writes are limited to the mid-session ones:** Today
   Execution's Start, Done (including its "Is the whole task done?"
   choices), Need more time, the coaching record, and ticking off a step
   on Assignment Detail. They're queued per student, sent in order when
   the connection returns, and safe to send twice. The server wins a
   conflict, with one calm message. Everything else says plainly that it
   needs a connection.
4. **W4 — updates:** a quiet "A new version is ready" note on Home
   (Refresh / Later), applied automatically on the next fresh launch
   otherwise. The app never reloads by itself mid-flow.
5. **W5 — push notifications are deferred** to a separate, later spec.
   They need server-side sending (keys, stored subscriptions, a
   scheduler), a clear product reason ("Notifications should be rare",
   Design Principles), and on iPhones an installed app on iOS 16.4 or
   later. Nothing in phase 2 depends on them.

Phase 2 is built in increments: **2a** (app shell offline + updates),
**2b** (last-known plan, read-only), **2c** (offline session actions).
**2d** (push) is the deferred item.

## Alternatives considered

- **A hand-written service worker:** no dependency, but we'd own
  precache versioning and clean-up, the usual source of "stuck on an old
  version".
- **The service worker caching Supabase responses:** transparent, but
  per-user responses in a shared cache, and no honest way to show how
  current the data is.
- **Offline everything:** planning, reordering and capture offline would
  need merging rules for a whole plan changed on two devices. That's
  disproportionate for a first offline version.
- **Updating silently on the spot:** simplest, but it can reload under a
  student mid-wizard or mid-check.

## Consequences

- The installed app's promise changes from "needs a connection" to
  "opens and shows your plan offline; mid-session actions save later".
  Copy must never imply more than that.
- Device timestamps (step 12) are what keep delayed saves accurate for
  supporters. Supporters see offline progress only once it's saved.
- Each increment needs an `analyze-feature` pass. 2a comes first; 2c is
  the riskiest (queue, conflicts, auth refresh).
- Push notifications stay in the backlog until a spec gives them a clear
  reason.
- *2b as built (2026-09-26):* W2A is a hand-written IndexedDB wrapper
  (`src/services/offlineStore.ts`), not a library. Stored reads are used
  only when the server can't be reached, and only for the signed-in
  student. The offline line is shown once, app-wide, in AppShell. See the
  spec's "Implementation Notes (as built) — 2b".
- *2c as built (2026-09-26):* see `20260926-offline-action-queue.md`.
  W3's "ticking off a step on Assignment Detail" turned out to be the
  step completion inside Today's Done (Assignment Detail has no tick
  control). The whole Done flow works offline, including completing the
  assignment and both reflections.
