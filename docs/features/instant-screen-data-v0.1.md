# Feature: Instant screens — show what's already known, then refresh

**Status:** Built 2026-09-26 (tag `v-pre-instant-screens`; see
"Implementation Notes (as built)" and
`docs/decisions/20260926-instant-screens.md`). Earlier: approved
2026-09-26. Decisions I1–I4 were
approved as recommended. Needs an `analyze-feature` pass. A lighter alternative to adopting
TanStack Query, which is on the Roadmap backlog for when its signals
appear.

## Summary

Moving between screens (tapping a tab, or returning from Assignment
Detail, Today or Settings) briefly shows the screen's heading with
nothing under it, then the content pops in. The data it's waiting for
is usually data the app loaded moments ago.

This keeps the **last result of each of the student's reads in memory**
for the session. A screen then renders **immediately** from that copy,
while the usual request refreshes it in the background and quietly
updates anything that changed.

## Current behaviour

- **Every screen change remounts the page.** This is on purpose: tabs
  reset to their landing view (`tabResetKeys` in `App.tsx`), and
  Assignment Detail, Today and the secondary screens replace the tab
  underneath (`20260817-assignment-detail-global-overlay.md`), so
  returning always re-reads fresh data.
- **Each read starts empty.** Its hook (`useAsyncData`, or
  `useAllWorkSessions`) starts from an empty value with `loading: true`,
  and fetches from Supabase. That's typically 100–400 ms against the
  hosted project.
- **Pages wait for all their data before showing content**
  (`HomePage.tsx`, `PlanPage.tsx`, `TodayExecutionPage.tsx`,
  `AssignmentsPage.tsx`). So there's no false "nothing here", but there
  is a blank area for the length of the request.
- **The student's reads already share one path.** The nine reads the
  student screens depend on go through `src/services/offlineCache.ts`
  (`cachedRead` / `ownRead`, PWA 2b), keyed per student:
  - activities, assignments, courses, study hours;
  - all work items, one assignment's work items;
  - one assignment;
  - one day's work sessions, and all work sessions.
  
  That layer keeps a copy on the device for offline use, and adds any
  unsaved offline changes to every read (2c). Today it serves the
  stored copy only when offline.

## User Story

As a student moving around the app, I want each screen to show my plan
straight away, so the app feels quick and steady rather than flashing
empty.

## Decisions (approved 2026-09-26, as recommended)

**I1. Where the instant copy comes from.**
- **Option A (recommended): memory only, for this session.** The latest
  fresh result of each read is kept in memory. The first visit to a
  screen after opening the app still waits (see I2), and every later
  visit is instant.
- **Option B: also start from the device's stored copy** (2b's IndexedDB
  copy, up to 7 days old) on the first visit. Opening the app would be
  instant too, but it could briefly show yesterday's plan before today's
  arrives: a visible "jump". Better left until A proves itself.

**I2. The first visit, when there's no copy yet.** *Recommended:* simple
placeholder blocks (skeletons) in the content area of Home, Plan, Today
and Assignments, instead of a blank area. They're quiet shapes, not
text, and marked `aria-busy`, so screen readers aren't told about a flash.

**I3. When a background refresh fails while the copy is showing.**
*Recommended:*
- **No connection:** keep showing the copy. The offline line (2b)
  already says it's offline.
- **A server error:** keep the copy on screen and show the screen's
  usual error banner above it, with Try again. Today the banner replaces
  the content.

**I4. After a save.** *Recommended:* any change sent to the server (any
write, including queued offline actions as they're sent) **drops the
student's in-memory copies**.
- The screen that made the change already shows it (its hooks update
  their own state, as now).
- The next screen visited after a change waits once (with I2's
  placeholders), rather than briefly showing data from before the
  change.
- It's simple and can't show old data. Finer-grained rules (only the
  reads a save affects) are exactly where TanStack Query would earn its
  place.

## Functional Requirements

1. **The memory copy** (`offlineCache.ts`): every fresh result of the
   student's own reads (`cachedRead` / `ownRead`) is also kept in memory
   under the same key. It's never kept for another student's reads (the
   supporter dashboard), the same guard as 2b.
2. **Looking without fetching:** each read service gets a synchronous
   companion that returns the memory copy, with unsaved offline changes
   applied (2c's `applyPending`), or nothing. Examples:
   `peekAssignments(studentId)`, `peekWorkSessionsForDate(studentId,
   date)`.
3. **Hooks start from the copy:**
   - `useAsyncData` takes an optional `peek`. If it returns data, the
     hook starts with that data and `loading: false`, and still fetches
     in the background, replacing the data when the fetch completes.
   - `useAllWorkSessions` does the same.
   - The hooks for the nine reads pass their `peek`.
   - **Pages don't change:** with every read already known, their
     "loading" gate is simply false on the first frame.
4. **Background refresh:** unchanged from today's fetch, including the
   PWA reconnect refresh. When it finishes, the screen updates in place.
   A student mid-gesture isn't interrupted: a drag in progress keeps its
   own state, as today.
5. **Dropping the copies** (I4): any write request to the server clears
   the student's memory copies. This means any request other than a read
   to the database API, sent through the Supabase client's fetch
   wrapper (`src/lib/supabase.ts` / `networkStatus.ts`). Sign-out and a
   different student signing in clear them too (as `clearOfflineData` /
   `setCacheOwner` do for the stored copy).
6. **The first visit** uses I2's placeholders. **Refresh failures** follow
   I3.
7. **Offline behaviour is unchanged.** With no connection, the stored
   copy (2b) is still what's shown, with the offline line.

## Accessibility

- A screen rendered from the copy is a normal screen. When the refresh
  changes something, it isn't announced, the same as any quiet update
  today.
- Placeholders (I2) are hidden from screen readers (`aria-hidden`), with
  the content area marked `aria-busy="true"` until it loads. They meet
  3:1 contrast as shapes, in both colour schemes.
- Focus isn't moved by a refresh.

## Acceptance Criteria

- **Returning to a screen visited earlier this session** (Home →
  Assignment Detail → Back; Home → Plan → Home; Today → Home) renders
  its content on the first frame, with no blank area. If the data
  changed meanwhile, it updates in place moments later.
- **After a change** (for example, Done on Today, or a new assignment),
  the next screen never shows the pre-change data. It waits once with
  placeholders, then shows the new data.
- **The first visit after opening the app** shows placeholders, not a
  blank area.
- **Sign-out, or another student signing in on the device,** clears the
  memory copies. Nothing of one student is ever shown to another, and
  the supporter dashboard is unaffected.
- **Offline** behaves exactly as PWA 2b/2c: the stored copy, the offline
  line, and queued changes applied.
- **A server error during a background refresh** keeps the content, with
  the error banner and Try again (I3).

## Testing Notes

- **Unit** (`offlineCache.test.ts`):
  - a fresh read fills the memory copy, and a peek returns it with
    pending changes applied;
  - another student's reads are never kept;
  - a write clears the copies;
  - sign-out or a new owner clears them.
- **`useAsyncData`:** with a peek, the first render has the data and
  `loading: false`, and the fetch still runs and replaces it; without
  one, behaviour is unchanged; I3 on a failed refresh.
- **Component:** Home rendered with peeked data shows its content in the
  first render, with no waiting for a promise; placeholders appear on a
  first visit.
- **Real browser** (production build, 320 px):
  - navigate Home → Assignment Detail → Back, and Home → Plan → Home,
    screenshotting within 50 ms of each navigation: content, not blank;
  - mark a session done on Today, go to Home: never the old state;
  - sign out and in as another student: none of the first student's data.

## Domain Model Touchpoints

None. Presentation and data-loading only.

## Explicitly Out of Scope

- **TanStack Query** (Roadmap backlog), and per-read invalidation rules
  (I4 keeps it simple on purpose).
- **Starting from the device's stored copy on first open** (I1, option B).
- **Prefetching** screens the student hasn't visited yet.
- **Keeping screens mounted between visits** (it would reverse the
  tab-reset and overlay design).
- **The supporter dashboard and the admin page** (not student reads).

## Implementation Notes (as built), 2026-09-26

- **Analysis decisions:**
  - J1: placeholders on Assignment Detail too;
  - J2: `refreshError` shown above content on the five main pages;
  - J3: `useAllWorkSessions` and `useEstimationDrift` start from the
    copy too.
  - F1, found in the analysis: a read overtaken by a save is set aside,
    both as the copy and in `useAsyncData` (read again).
- **Code:**
  - `src/lib/networkStatus.ts`: the save signal (`writeCount`,
    `subscribeWrites`). Database writes count as they start; reads and
    sign-in don't.
  - `src/services/offlineCache.ts`: the memory copy, `peekRead` and
    `peekOwnRead`. It's cleared on any save, on sign-out, and on a
    change of student.
  - Peeks in the activity, assignment, course, preferences, work item
    and work session services.
  - `src/hooks/useAsyncData.ts`: `peek`, `refreshError`, the F1 guard,
    and the copy for a new fetcher at once (F3).
  - Every read hook passes its peek.
  - `src/components/ContentPlaceholder.tsx`, used on Home, Plan (both
    views), Today, Assignments and Assignment Detail, alongside the
    refresh-failed banner (`REFRESH_FAILED` in `src/lib/errorMessage.ts`).
- **Also fixed:** Assignment Detail showed the assignment before its
  steps had loaded, so "No steps yet" flashed on a first visit. It now
  waits for both.
- **Deviation from the Accessibility section:** the placeholders don't
  meet 3:1 as shapes. They're decorative (`aria-hidden`, no
  information), so WCAG 1.4.11 doesn't apply. The busy area says
  "Loading…" to screen readers once. Reaching 3:1 would need about 80%
  opacity of the muted text colour, heavy bars that defeat "quiet".
- **Tests:**
  - `networkStatus` (save counting);
  - `offlineCache` (7: kept and peeked, never for another student,
    Assignment Detail's reads, a save drops all, an overtaken read not
    kept, sign-out or a change of student, the offline copy not
    mistaken for fresh);
  - `offlineQueue` (a peek applies waiting changes);
  - `useAsyncData` (6: the first render from the copy with a refresh,
    unchanged without, F1, F3, I3 with Try again in place, quiet
    offline);
  - `HomePage.instant.test.tsx` (content in the first render with no
    waiting, first-visit placeholders marked busy, a failed refresh
    keeping content with the banner).
  
  Every test that mocks the read services now provides the peeks as
  "no copy".
- **Real browser** (a dev server at 320 px against local Supabase, with
  every database read delayed 1.5 s so the copy is distinguishable from
  a fast server), 7 checks:
  - Assignment Detail shows placeholders on a first visit, and content
    at once on a second;
  - Back to Home, Home → Plan and Plan → Home all show content within
    150 ms;
  - after Done on Today, Home never showed the session as still to
    start;
  - another student signing in on the same device sees none of the
    first student's data.
- **Found, not fixed (existing):** after signing out and in again,
  possibly as another student, the app reopens on whichever screen was
  open before (Settings, in the check), instead of Home. It's recorded
  in the Roadmap backlog.

