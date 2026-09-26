# Instant screens: an in-memory copy of each read, dropped on any save

Date: 2026-09-26

## Context

Every screen change remounts the page, by design (tab resets, and the
overlays of `20260817-assignment-detail-global-overlay.md`), and each
remount re-reads from the server. So each navigation showed a blank
content area for the length of the request. `instant-screen-data-v0.1.md`
(I1–I4, and J1–J3 from its analysis, approved 2026-09-26) chose a small,
hand-rolled fix over adopting TanStack Query. TanStack Query is kept on
the Roadmap backlog, with the signals that would justify it.

## Decision

1. **The services layer keeps the latest fresh result of each of the
   signed-in student's reads in memory** for the session
   (`offlineCache.ts`, beside the 2b offline copy, under the same keys).
   It's never kept for another student's reads.
2. **Synchronous peeks** (`peekAssignments`, `peekWorkSessionsForDate` …)
   return that copy, with unsaved offline changes applied.
   `useAsyncData` takes an optional `peek`, starts from it with no
   loading, and still refreshes in the background.
   `useAllWorkSessions` and `useEstimationDrift` do the same.
3. **Any save drops every copy** (I4). The Supabase client's fetch
   wrapper counts each request to the database API that isn't a read
   (`writeCount` / `subscribeWrites` in `src/lib/networkStatus.ts`).
   Sign-out and a change of student drop the copies too.
4. **A read overtaken by a save is set aside (F1).** A read that was on
   its way when a save started may predate the save. Its answer isn't
   kept as the copy, and `useAsyncData` reads again rather than show it.
   Without this, instant screens would let a student act before the
   refresh lands, and see their change flip back.
5. **First visits show `ContentPlaceholder`** (I2, J1). **A failed
   background refresh keeps the content** and shows a `refreshError`
   banner above it (I3, J2). Offline, it stays quiet, since the offline
   line already explains.

## Alternatives considered

- **TanStack Query:** shared cache, per-query invalidation,
  deduplication. It's a medium refactor across 17 callers, with new
  invalidation rules to get right. It's deferred until its signals
  appear (Roadmap backlog).
- **Keeping screens mounted:** it would reverse the tab-reset and
  overlay design, and not help the overlays.
- **Starting from the device's stored copy on first open (I1, option
  B):** it could flash yesterday's plan.
- **Invalidating only the reads each save affects:** that's exactly
  TanStack Query's job, so the blunt "any save drops all" is used
  instead.

## Consequences

- Screens visited earlier in the session render on the first frame, and
  update in place if the data changed.
- The first screen visited after any save waits once, with placeholders.
- Tests that mock the read services also provide the peeks, returning
  "no copy".
- Moving to TanStack Query later maps directly: peeks become cached
  queries, and the save signal becomes invalidation.
