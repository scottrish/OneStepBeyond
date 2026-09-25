# Reordering planned sessions: drag, re-chaining, and retiming

Date: 2026-09-25

## Context

Roadmap Phase 7 step 10 builds `daily-planning-and-completion-v2-proposal.md`
item 2 (what reorders, what gets re-timed, when it's saved) and
`mobile-gestures-reorder-and-swipe-v0.1.md` §1 (drag handles and the
Earlier/Later fallback), on three lists: the Schedule step's drafts, the
existing-day view, and each day in Week Look-Ahead.

The specs left four questions open, and building it raised two more
(how to save many times in one reorder, and whether to record a Domain
Event). The product owner settled the first four on 2026-09-25.

## Decision

1. **D1 — adopt `@dnd-kit` drag, plus Earlier/Later.** `@dnd-kit/core`,
   `/sortable` and `/utilities` power a shared `SortableList`
   (`src/components/SortableList.tsx`). It has a 44×44 px handle,
   `touch-action: none` on the handle only, a pointer drag that starts
   after 8 px, keyboard sorting, vertical movement only, and screen-reader
   announcements that use row titles (`src/lib/sortAnnouncements.ts`),
   never ids. Every list also offers Earlier/Later (WCAG 2.2 SC 2.5.7).
   Building sortable by hand wasn't worth it: keyboard sorting and
   live-region announcements are the hard parts, and dnd-kit already does
   both. This reverses the "no drag" reasoning in `src/domain/reorder.ts`
   for session lists only. The breakdown draft steps keep their ↑/↓
   buttons.
2. **W — the weekend rule is option (a).** Activities (with travel) are
   obstacles for the chain on every day, not only through study windows.
   `defaultStartTimes` already worked this way. Option (b) (reorder
   without re-timing on days with no windows) would have needed a new
   `plan_order` column, because order is derived from `start_time`
   everywhere (`sortByStartTime`). With (a), **no `planOrder` is saved.**
   The re-chained start times *are* the order.
3. **N1 — a re-chain that would run past midnight is refused.** If any
   planned session would start at or after midnight, nothing changes and
   an inline, dismissable message says so ("That order runs past midnight.
   Try moving something to another day."). A session may still *start*
   before midnight and run past it, which matches `defaultStartTimes`. The
   prototype wraps the clock instead (`% 24`). This app never does.
4. **N2 — Schedule and Look Ahead use an overflow menu** (Earlier /
   Later / Remove) as the non-drag route, alongside swipe-to-Remove. The
   day view keeps its edit sheet, which gains retime and Earlier/Later.
5. **One scheduler.** `src/domain/defaultStartTimes.ts` now shares one
   chain loop between `defaultStartTimes` (new work) and `rechainTimes`
   (reorders). A re-chain starts at the earliest time the group already
   had, even a time the student set by hand before the first window, or
   at the first window if none had a time. `rechainDay` adds a saved day's
   rules on top: started and done sessions stay put and are obstacles.
   Plan and Look Ahead both use it.
6. **Saving.** `workSessionService.updateWorkSessionStartTimes` sends one
   `update start_time` per changed session, in parallel. Each is guarded
   by `status = 'planned'`, so an out-of-date list can't re-time a session
   that was started meanwhile. It isn't atomic: there are no Postgres
   functions yet, and an upsert would have to resend whole rows (risking
   an out-of-date `status`, or recreating a deleted session). The screen
   updates straight away. On failure, the error shows and the day reloads
   from the server. A partial failure can leave some times out of date,
   but loses no data.
7. **Retiming** one session (in the edit sheet) checks the time against
   every other *timed* session that day (any status) and the day's
   activities with travel. Chips that would overlap are disabled. A manual
   time that overlaps is refused, naming the earliest block it runs into.
   It is never moved to the nearest free slot.
8. **No Domain Event is recorded** for a reorder or retime, the same as
   Move and Remove. The only persisted planning event is still
   `planning_sessions` (Plan Confirmed). The Domain Model's "Work Session
   Rescheduled" stays unimplemented until an event log exists for it.

## Alternatives considered

- **Earlier/Later buttons only (D1 option B).** No dependency, but not
  parity with the prototype, and reordering on a phone takes one more tap
  per move.
- **A `plan_order` column.** Only needed under W option (b). It would
  mean a migration, and two sources of truth for order.
- **A Postgres function for an atomic multi-row update.** It would be the
  first RPC in the codebase, for a write where a partial failure is
  harmless and fixed by a reload.
- **Re-chaining a reorder that doesn't fit before midnight by leaving
  sessions without a time.** That silently removes a time the student
  had.

## Consequences

- Invariant 4 (the student owns the Plan): a reorder re-times sessions
  the student may have set by hand. The student starts the reorder and
  sees the result straight away, and a single session can be retimed by
  hand afterwards.
- Re-chaining today can produce times earlier than the current time,
  because the chain starts at the earliest existing time. Left as is; not
  in scope.
- Dropping a planned row next to a started or done row can end with it
  somewhere else after re-timing, because the list is sorted by time. The
  drop announcement reports the position the drag ended on.
- When `study-hours-v2-proposal.md` gives weekends study windows, the
  obstacle rule still holds, and the 16:00 weekend starting point goes
  away.
- `swipeGesture.ts` gains a `data-no-swipe` opt-out, used by the Schedule
  step's sideways-scrolling time chips.
