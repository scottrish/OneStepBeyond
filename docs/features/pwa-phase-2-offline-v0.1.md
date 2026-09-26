# Feature: PWA phase 2 — works offline, stays up to date

**Status:** Approved 2026-09-25. **Increment 2a built 2026-09-25**
(tag `v-pre-pwa-offline-shell` marks the state before; see
"Implementation Notes (as built) — 2a"). **Increment 2b built
2026-09-26** (tag `v-pre-pwa-offline-data`; see "Implementation Notes
(as built) — 2b"). 2c not yet built. W1–W4 approved as
recommended, and W5 (push notifications) deferred
(`docs/decisions/20260925-pwa-phase-2-approach.md`). This is roadmap
Phase 7 step 13 ("After parity"), phase 2 of
`docs/decisions/20260924-pwa-in-two-phases.md`, which lists six questions
this spec answers (each has its own section below). Built in three
increments (2a, 2b, 2c), each with its own `analyze-feature` pass. 2a
comes first.

## Summary

Since phase 1 (`mobile-app-shell-and-touch-ergonomics-v0.1.md` §7), the
app can be installed to a phone's home screen, but it still needs a
connection for everything. On a bus, in a school basement, or with
patchy home Wi-Fi, it shows a browser error instead of the student's
plan. Phase 2 makes the installed app:

1. **open without a connection** (the app itself is stored on the
   device);
2. **show the student's latest plan offline**, clearly marked with how
   current it is;
3. **keep the actions that matter mid-session working offline** —
   starting, finishing and extending a work session, and ticking off a
   step — saving them when the connection returns;
4. **update itself safely**, so nobody is stuck on an old version, and
   nothing reloads under a student in the middle of something.

**Push notifications** are assessed here, but recommended as a separate,
later spec (W5).

## Source

No prototype evidence: `../OneStepBeyondPrototype` has no service worker,
no offline behaviour and no notifications (`20260924-pwa-in-two-phases.md`,
finding 1). This is this app's own design, following
`Design-Principles.md`, especially "Design for Calm": "Clean.
Predictable. Quiet. … Notifications should be rare."

## Current behaviour

- **No service worker.** Phase 1 deliberately registered none (§7's
  acceptance criteria). Offline, the installed app shows the device's
  "no connection" page.
- **Every read and write goes straight to Supabase** from
  `src/services/*` (CLAUDE.md: every data access sits behind that
  layer, which is what keeps this phase additive). Screens load through
  `useAsyncData` (loading / error / Try again).
- **Auth:** supabase-js keeps the session in browser storage and
  refreshes its access token (about hourly) over the network.
- **Timestamps** for starting and finishing a session come from the
  device's clock (`startWorkSession` / `completeWorkSession`, step 12a).
  So an action saved late still records when it really happened.

## User Story

As a student with an unreliable connection, I want the app to open and
show my plan, and let me start, extend and finish my work, even when
I'm offline, so a bad signal never stops me following through on what I
planned.

## Decisions required

**W1. Tooling.** *Approved 2026-09-25: Option A.* CLAUDE.md held back "a PWA build plugin" until this
phase.
- **Option A (recommended): `vite-plugin-pwa`** (Workbox underneath).
  It precaches the built app with version hashes, generates the service
  worker, and has a tested update flow. One dev dependency.
- **Option B:** a hand-written service worker. No dependency, but we'd
  own precache versioning and cache clean-up, which is where subtle "stuck
  on an old version" bugs come from.

**W2. Where cached data lives.** *Approved 2026-09-25: Option A.*
- **Option A (recommended): IndexedDB, from `src/services/`**, keyed by
  the signed-in student, holding the last copy of each read the offline
  screens need. It's per user, cleared on sign-out, and survives the
  service worker being replaced.
- **Option B: the service worker caches Supabase responses.** It's
  transparent to the app, but responses depend on the signed-in user
  (RLS), and the app can't tell "fresh" from "stored" to mark staleness
  honestly. That breaks answer 3 below.

**W3. Which writes work offline** (answer 4 below). *Approved 2026-09-25 as recommended.* *Recommended*: only
Today Execution's session actions and ticking off a step. Everything
else says, plainly, that it needs a connection.

**W4. How updates are applied** (answer 6 below). *Approved 2026-09-25 as recommended.* *Recommended*: a
quiet "Update ready" note with a **Refresh** button, never shown
mid-flow. It's applied automatically the next time the app opens from
the home screen.

**W5. Push notifications.** *Deferred 2026-09-25: a separate, later spec.* *Recommended*: a separate spec, not part of
this one. They need server-side infrastructure this app doesn't have
(keys for sending, stored subscriptions, a scheduled sender), a clear
product reason to notify at all (the Design Principles say
notifications should be rare), and on iPhones they only work in an
installed app from iOS 16.4.

## Increments

| # | Increment | Depends on | Delivers |
|---|---|---|---|
| **2a** | App shell offline + safe updates | W1, W4 | The app opens offline (showing "You're offline" instead of the browser's error); the update flow. No data cached yet. |
| **2b** | Last-known plan, read-only | 2a, W2 | Today, Home and Plan's day view show the last copy of the student's data offline, marked with how current it is. |
| **2c** | Offline session actions | 2b, W3 | Start, Done, Need more time, and ticking a step work offline, queued and saved when back online. |
| **2d** | Push notifications | Deferred (W5) | Not part of phase 2; a separate spec when there's a clear reason to notify |

## The six questions from `20260924-pwa-in-two-phases.md`

### 1. Which Supabase data may be cached, and for how long?

- **The app itself** (HTML, JS, CSS, fonts, icons) is precached by the
  service worker, in a version-stamped cache. Old versions are removed
  once a new one takes over.
- **Student data (2b)**, kept by the services layer in IndexedDB (W2A)
  for the signed-in student only:
  - the student's work sessions (each day read, plus the full list
    Home and Look Ahead use);
  - assignments and their steps; courses; activities; study hours.
  - *As built (2b):* these are the seven list reads the student screens
    already make, stored whole, rather than a "today plus 6 days" slice.
    The screens then read exactly what they read online.

  This is exactly what the offline screens read. It's refreshed on every
  successful load, so it's always the latest copy the device saw.
- **Kept for 7 days** after the last successful load, then discarded
  (the plan would be misleading by then). **Cleared on sign-out**, and
  whenever a different student signs in on the device.
- **Never cached:**
  - the supporter dashboard's data (another person's information, on a
    device that may be shared);
  - invitations;
  - reflections and coaching records (written, never read back offline);
  - anything for another student.

### 2. How do auth sessions and token refresh behave offline?

- supabase-js already keeps the session on the device. Offline, the app
  treats that stored session as "who is signed in" for **reading the
  cache and queuing writes**. It never uses it to talk to the server
  offline.
- The access token will expire while offline. That's harmless: nothing
  is sent until the connection returns. Then supabase-js refreshes the
  token first, and only then does the queue send.
- **If refreshing fails** (the refresh token expired or was revoked),
  the student is asked to sign in again. Their queued actions are kept,
  and sent after they sign back in **as the same student**. If a
  different account signs in, the queue is discarded, and the discard is
  logged for debugging.
- **Signing out with unsaved actions** warns first: "You have changes
  that haven't been saved yet. Signing out will lose them." Choices:
  **Stay signed in** / **Sign out anyway**.

### 3. What does a student see when planning data may be stale?

- A calm, persistent line at the top of each screen that shows cached
  data, never a red error: **"You're offline. Showing your plan from
  {time}."** (or **"… from yesterday at {time}"** / **"… from {weekday}"**).
  When back online it disappears once fresh data has loaded.
- **"Changes will be saved when you're back online."** is added when
  something is queued, and **"{N} changes waiting to be saved"** in
  Settings, so it's never invisible.
- Actions that need a connection (W3) are **still shown**. Tapping one
  says why, in place: **"You'll need to be online to do this."** They're
  not hidden or silently disabled, and nothing implies it worked.
- Nothing ever says "error", "failed" or "late" for being offline.

### 4. How are writes made offline queued, retried, and reconciled?

- **What works offline (W3, recommended):**
  - Today Execution: **Start**, **Done** (including "Is the whole task
    done?" and "Not yet"), **Need more time**, and the coaching record
    (friction and response);
  - Assignment Detail: **ticking off a step**.

  These are what a student does mid-session. Everything else (planning,
  reordering, rescheduling, capture, editing and deleting, course
  changes, Study hours, Appearance aside) needs a connection in this
  phase.
- **The queue** lives in IndexedDB beside the cache, **one ordered queue
  per student**, owned by the services layer. A queued action updates
  the cached copy straight away, so the screen reflects it.
- **Sending:** when the connection returns (the browser's `online`
  event, and when the app is opened or brought to the front), the queue
  sends **in order, one at a time**. Background Sync is a bonus where the
  browser has it (Chromium), not a requirement, because iPhones don't
  support it.
- **Safe to repeat:** each queued action carries its own id and the
  device's timestamp. Sends are written so that sending twice has the
  same effect as once. For example, Start only applies to a session
  that's still `planned`, and Done only to one not already done.
  Existing guards like `rescheduleWorkSession` and `status = 'planned'`
  already follow this pattern.
- **Conflicts:** the server's state wins when an action no longer makes
  sense. For example, the session was removed on another device, or is
  already done. The action is dropped and the student is told once,
  calmly: **"Some changes from while you were offline didn't apply,
  because the plan changed on another device."** This never interrupts
  a task in progress.
- **Real failures** (a server error, not a conflict) retry with backoff.
  After three failures the action stays queued, and Settings offers
  **Try again** or **Discard**.

### 5. How does this affect what a coach or parent sees?

- Supporters see only what's reached the server. Offline progress
  appears **once it's saved**, with the **real times** it happened (the
  device's timestamps), so elapsed time and "started at" stay accurate.
- The dashboard doesn't show pending changes. Nothing is cached for
  supporters.
- `coach-parent-dashboard-feature-spec-v0.1.md` should add one line: data
  can arrive late, so it is never "missing" just because it isn't there
  yet.

### 6. How are updates rolled out?

- **W4 (recommended):** when a new version has downloaded, a quiet note
  appears on Home (not mid-flow): **"A new version is ready."**
  **Refresh** / **Later**. If ignored, it applies automatically the next
  time the app opens fresh. So nobody stays on an old version beyond one
  more session.
- **Never reloads by itself mid-flow:** not in the Plan wizard, an open
  sheet, a completion check or a reflection.
- **Must refresh** (rare): if a new version changes a database contract
  the old version breaks against, the service worker may require a
  refresh before anything is sent. The queue survives the refresh.
- In development, the service worker is off (or clearly marked), so
  "my change isn't showing" never happens while building features
  (`20260924-pwa-in-two-phases.md`, alternatives).

## Functional Requirements (by increment)

**2a**
- A service worker precaches the built app and serves it offline. The
  app opens from the home screen with no connection.
- Offline with nothing cached yet (before 2b), screens show **"You're
  offline. Your plan will appear when you're back online."**, not a
  browser error.
- The update flow as in answer 6.
- `index.html`'s inline appearance script and the manifest keep working
  (the script is inline, so the service worker precaches it with the
  page).

**2b**
- The services named in answer 1 keep the last copy and serve it when
  offline. Hooks expose whether data is cached, and from when, and
  screens show answer 3's line.
- Cache lifetime, per-student keys, clearing on sign-out, and the 7-day
  limit, as in answer 1.

**2c**
- The queue, sending, safe repeats, conflicts and failures, as in answer
  4. The sign-out warning, as in answer 2.
- Online-only actions explain themselves, as in answer 3.

## Accessibility

- The offline line is plain text in a polite live region (announced once,
  not repeatedly), with at least 4.5:1 contrast in both colour schemes.
- "You'll need to be online to do this" is announced where the action
  was tapped. Focus stays put.
- The update note is reachable by keyboard, and never steals focus.

## Acceptance Criteria

- **2a:** installed and offline, the app opens to its own screen, not a
  browser error. After a new version deploys, the student sees "A new
  version is ready" on Home and can refresh; otherwise the next launch
  is on the new version. The app never reloads mid-wizard, mid-sheet or
  mid-check. In development no service worker is active.
- **2b:** after one online visit, turning the connection off and
  reopening shows Today, Home and Plan's day view from the stored copy,
  with "You're offline. Showing your plan from {time}." Signing out
  clears the copy. A copy older than 7 days isn't shown. Another
  student's data is never stored, even when the supporter dashboard reads
  it on this device. Offline, an action that needs the server says
  "You'll need to be online to do this."
- **2c:** offline, starting, extending (Need more time) and finishing a
  session, and ticking a step, all update the screen straight away and
  save correctly, with the original times, when the connection returns.
  Sending twice has no extra effect. An action made obsolete on another
  device is dropped, with one calm message. Signing out with unsaved
  actions warns first. An online-only action explains itself.
- **Throughout:** nothing implies an action worked when it hasn't been
  saved or queued. No copy says "error", "failed" or "late" for being
  offline.

## Testing Notes

- **Unit:** cache lifetime and per-student keys; queue ordering; the
  safe-repeat guards (pure); conflict classification; the wording of
  "from {time}".
- **Service tests:** reads fall back to the cache on a network failure;
  writes queue when offline and send in order when back online.
- **Real browser** (Playwright on a production build, since the service
  worker is off in dev): go offline with `context.setOffline(true)` →
  reopen → cached screens and the offline line; queue actions → back
  online → database rows correct, with the original timestamps; update
  flow (serve build A, then build B); installed-mode checks at 320 px.

## Domain Model Touchpoints

- No new domain concepts. An offline action is the same Work Session
  transition, just saved later. Its real time comes from the device, as
  it already does.
- `coaching_interactions` and the session timing columns (step 12)
  already record the device's times, which is what keeps delayed saves
  accurate.

## Explicitly Out of Scope

- Push notifications (W5, a separate spec).
- Offline planning, reordering, rescheduling, capture, breakdown, or any
  edit or delete beyond W3's list.
- Offline for the supporter dashboard.
- Capacitor or native wrapping (still undecided; CLAUDE.md).
- Syncing between the student's own devices beyond what the server
  already does.

## Implementation Notes (as built) — 2a, 2026-09-25

- **Decisions:** W1 (`vite-plugin-pwa`) and W4 (the update note), plus
  O1 and O2 from the analysis. O1: offline, load errors say "You're
  offline. This will load when you're back online." and retry by
  themselves. O2: "Later" lasts until the app is next opened.
- **Build** (`vite.config.ts`):
  - the service worker pre-stores the built app (18 files: the page,
    every code chunk including the dashboard and invite pages, the icons,
    and the manifest);
  - it serves the app's page for any address in the app;
  - Google Fonts: the stylesheet is refreshed in the background, and the
    font files are stored for a year;
  - Supabase is never cached;
  - `manifest: false`, so phase 1's manifest is kept;
  - it's off in development, and registered from `src/main.tsx` in
    production builds only (`src/lib/registerServiceWorker.ts`).
- **Updates:** `src/lib/pwaUpdateStore.ts` and `src/pages/home/UpdateNote.tsx`
  ("A new version is ready." Refresh / Later), on Home only.
- **Found during analysis — offline, a signed-in student was shown
  Login.** `useAuth` let a failed `getUser()` (a network request) clear
  the user that the stored session had just restored. It now ignores a
  failed check. The server still enforces who can read what.
- **Found in the real browser — `navigator.onLine` can't be trusted on
  its own.** It can say "online" with no internet (Wi-Fi without a
  connection, or just after the app opens offline).
  - `src/lib/networkStatus.ts` wraps the Supabase client's fetch. It
    fails at once when the browser knows it's offline (as an AbortError,
    so Supabase doesn't spend about 7 seconds retrying), and notes
    whether each request reached the server.
  - `useOnlineStatus` means "the browser says online **and** the last
    request got through".
  - The browser's `online` event (or returning to the app) clears the
    "unreachable" mark, so waiting screens retry by themselves. That was
    a bug caught by the same check: without it, the app stayed "offline"
    after the connection returned.
  - The offline banner keeps a quiet Try again, for when the browser
    never reports a change.
- **Login** offline says "You're offline. Connect to sign in." and
  doesn't try.
- **Verified in a real browser** (Chromium, a production build via
  `vite preview`, 320 px, local Supabase), 12 checks:
  - the service worker takes control;
  - offline, the app opens, stays signed in, uses its own fonts and says
    so calmly (immediately when the browser reports offline; about 7 s
    when it wrongly says online);
  - `/dashboard` opens offline;
  - back online, the screen loads by itself;
  - no Supabase request is cached;
  - a new build is offered on Home without reloading, and Refresh loads
    it;
  - Login offline.
- **Testing note:** Playwright's offline mode changes `navigator.onLine`
  on an open page, but not after a reload, and it doesn't fire the
  browser's `online` / `offline` events. The checks send those events,
  as a real device would.
- **Not yet:** the supporter dashboard shows "Loading…" offline until its
  requests fail, and uses its own messages. It doesn't store data
  offline (by design). Check on a real iPhone that an installed app takes
  up a new version on the next launch.

## Implementation Notes (as built) — 2b, 2026-09-26

- **Decisions:** B1, the offline line is shown once, app-wide, at the
  top of every student screen (`src/components/OfflineLine.tsx` in
  AppShell), not repeated per screen. B2, a small hand-written IndexedDB
  wrapper (`src/services/offlineStore.ts`, database `osb-offline`) with
  an in-memory version for tests, rather than a library. B3, a request
  that fails for lack of a connection reads "You'll need to be online to
  do this." (`src/lib/errorMessage.ts`, via
  `src/domain/offlineWording.ts`).
- **Storing** (`src/services/offlineCache.ts`, `cachedRead`): seven
  service reads keep their last successful result, keyed
  `{studentId}:{read}`:
  - `listActivities`, `listAssignments`, `listCourses`, `getPreferences`,
    `listWorkItemsForStudent`;
  - `listWorkSessionsForDate` (one entry per day read) and
    `listWorkSessionsForStudent`.

  Hooks and screens are unchanged: they get the stored copy exactly as
  they'd get the server's.
- **When the stored copy is used:** only when a read fails **and** the
  server can't be reached (`networkStatus`, 2a). A server error while
  online is still shown as an error, never hidden behind old data. A copy
  older than 7 days is ignored.
- **Whose data:** only the signed-in student's. `useAuth` sets the
  owner the moment it knows who's signed in (before any screen reads). A
  read for any other student id (the supporter dashboard) is neither
  stored nor served. If a different student signs in, everything stored
  is cleared first. Signing out clears it all. A save still in flight
  when that happens is dropped (a generation check), which was a race
  caught by the unit tests.
- **Back online:** `useAsyncData` and `useAllWorkSessions` read again
  by themselves when the connection returns, so the line disappears and
  the screens catch up.
- **Verified in a real browser** (Chromium, a production build via
  `vite preview`, 320 px, local Supabase), 10 checks:
  - online, the seven reads are stored under the student's id, with no
    offline line;
  - offline after a reload, Home, Assignments and Plan show the stored
    plan with the one line ("You're offline. Showing your plan from
    12:34 AM."), with no "Couldn't load" and no alert;
  - offline, Today's Start says "You'll need to be online to do this.";
  - back online, the line goes away;
  - signing out leaves nothing in IndexedDB.
- **Not yet:**
  - **Assignment Detail** (`getAssignment`) isn't stored. Offline it
    says "Couldn't load this assignment." It was outside 2b's screens
    (Today, Home, Plan). Worth adding in 2c, or as a small follow-up.
  - Home's Start swallows a failed save and opens Today (by design,
    step 11), so the offline message appears on Today's own Start. 2c
    makes Start work offline anyway.
  - In Playwright, `navigator.onLine` reads true after an offline reload,
    so the first reads wait for Supabase's retries (about 7 s) before
    falling back. A real device reporting offline falls back at once.

