# Feature: Offline fast fallback — show the stored plan without waiting

**Status:** Draft 2026-09-26, not yet built. Low priority: an
optimization to PWA phase 2 (`pwa-phase-2-offline-v0.1.md`), which
already works offline. Listed in the Roadmap backlog. Needs an
`analyze-feature` pass and a decision record when it's picked up.

## Summary

Offline, the app does show the student's stored plan, but sometimes only
after a long wait. The waits come from the Supabase client libraries
retrying requests that can't succeed. This spec cuts them out, so the
stored plan appears at once whenever the app already knows the server
can't be reached, and recovers promptly when it can.

## Current behaviour

Measured 2026-09-26 in a real browser (Chromium, production build,
320 px, local Supabase). Each figure is the time for the Assignments
screen to appear offline:

| Situation | Time |
|---|---|
| A. The phone knows it's offline; signed in within the last hour | ~60 ms |
| B. The phone thinks it's online, but there's no connection (Wi-Fi without internet, weak signal) | ~7.4 s |
| C. The phone knows it's offline, but the sign-in token has expired (the app was last used more than about an hour ago) | ~25.5 s |

C is the common real case: opening the installed app on the bus, an hour
or more after last using it.

**Why B takes ~7 s.** Supabase's data client (`@supabase/postgrest-js`)
retries a failed read (GET) three times, waiting 1 s, 2 s, then 4 s.
`src/lib/networkStatus.ts`'s `reachabilityFetch` stops this only when
`navigator.onLine` is false: it throws an `AbortError`, which the
library doesn't retry. When the browser says it's online, every attempt
goes out and fails. If the connection hangs instead of failing, each
attempt takes longer still.

**Why C takes ~25 s.** The access token lasts an hour. Before every data
request, supabase-js calls `auth.getSession()`, which refreshes an
expired (or nearly expired) token. `@supabase/auth-js` retries the
refresh with growing waits (0.2 s, 0.4 s, 0.8 s …) for up to a
30-second window. It treats every fetch failure as retryable, including
our `AbortError`, so knowing the phone is offline doesn't help. Every
read waits behind that refresh, even though the stored copy is on the
device.

Saves are already fast. `sendOrQueue` (2c) queues without sending when
the app knows it's offline, and the queue only sends once the connection
is back.

## User Story

As a student opening the app without a connection, I want my plan to
appear straight away, so the app feels ready rather than stuck.

## Decisions required

**F1. How to stop the data library's retries after a network failure.**
- **Option A (recommended): fail the retries at once.**
  `reachabilityFetch` throws an `AbortError` for a request that's a
  retry (postgrest-js adds an `X-Retry-Count` header) when the previous
  attempt failed for lack of a connection. The first attempt is
  unchanged, and retries after a genuine server hiccup (503 or 520)
  still happen.
- **Option B: turn retries off** (`createClient(..., { db: { retry: false } })`).
  Simplest, but it also drops the retries for genuine server hiccups.

**F2. A time limit per request.** *Recommended:* 8 s, after which the
request fails as a network failure and the stored copy is shown. This
covers a connection that hangs rather than fails.

**F3. How often to check whether the connection is back** while the app
thinks it's offline but the phone says it's online. *Recommended:* every
20 s, with one small request to the server. It only runs while the app
is open and in front.

## Functional Requirements

1. **Don't ask the server when it's known to be unreachable.**
   `cachedRead` (`src/services/offlineCache.ts`) checks first: if the
   server is known to be unreachable (`navigator.onLine` is false, or
   the last request failed for lack of a connection) and a stored copy
   exists, it returns the stored copy without calling the server. That
   also skips `getSession()` and its token refresh. With no stored copy,
   it tries the server as it does today.
2. **Stop retrying reads after a network failure** (F1).
3. **Limit how long one request can take** (F2), in `reachabilityFetch`.
   A request that runs out of time counts as a network failure: it marks
   the server unreachable and gets the same "You're offline" wording.
4. **Notice when the connection comes back** (F3). Besides the browser's
   `online` event and returning to the app (2a), a periodic check while
   the server is marked unreachable. When it succeeds, reachability
   resets, and screens and the offline queue catch up by themselves, as
   they do today.
5. **The sign-in refresh isn't changed.** It still happens once the
   connection is back, before the queue sends (2c). Requirement 1 simply
   stops reads from waiting on it while offline.

## Acceptance Criteria

- **C:** the phone reports offline and the token has expired. After one
  online visit, the stored plan appears in under 1 s, with the usual
  offline line.
- **B:** the phone says it's online but there's no connection. The
  first screen falls back to the stored plan within one failed request
  (at most F2's limit), and later screens appear at once.
- **A** stays as fast as it is now.
- Back online (browser event, returning to the app, or F3's check), the
  screens refresh and queued changes are sent, without the student doing
  anything.
- Online behaviour is unchanged: a server error still shows as an error,
  and a genuine server hiccup (503 or 520) is still retried.
- Nothing in this spec stores or serves another student's data (the 2b
  guard holds).

## Testing Notes

- **Unit:**
  - `cachedRead` returns the stored copy without calling the fetcher
    when the server is known to be unreachable, and calls it when there's
    no stored copy;
  - `reachabilityFetch` fails a retry at once after a network failure,
    and doesn't after a 503;
  - a request over the time limit fails as a network failure;
  - the reconnect check resets reachability on success and does nothing
    while reachable.
- **Real browser** (production build via `vite preview`): repeat the
  three measurements above (the check script is described in the 2c
  notes). For C, set the stored session's `expires_at` in the past
  before going offline. Then confirm that reconnecting refreshes the
  screens and sends the queue.

## Domain Model Touchpoints

None. This changes how quickly stored data is shown, not what's stored
or who owns it.

## Explicitly Out of Scope

- Changing how or when the sign-in token is refreshed online.
- Extending the 1-hour token lifetime (a Supabase project setting).
- Background Sync, and anything the service worker does.
- Assignment Detail's "open once online first" limitation (2c notes).
