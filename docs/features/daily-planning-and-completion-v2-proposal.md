# Feature: Daily Planning & Completion — Prototype Sync (v2 proposal)

**Status:** Partly implemented. **Item 2** (reorder, re-chain, retime,
with drag) was built 2026-09-25 as roadmap Phase 7 step 10
(`docs/decisions/20260925-session-reorder-and-drag.md`). **Item 10** (existing-day view) and
**items 6b/6c** (Select's "Planned today" note and same-day disable) were
built 2026-09-25 as roadmap Phase 7 step 9, together with append-only
confirm (`docs/decisions/20260925-existing-day-view.md`,
`20260925-confirm-plan-appends.md`). Everything else is still proposed,
not yet approved. Produced from a prototype-sync
audit of `../OneStepBeyondPrototype` (baseline commit `834368f`, the
prototype's state when this app's specs were last synced from it on
2026-08-18/20; `main` HEAD `744026a` as of 2026-09-24 — roughly five
weeks and ~280 commits of further iteration). **Re-synced 2026-09-24**
against the prototype's unmerged `mobile-redesign` branch (`1ce3145`,
44 commits on top of `744026a`). That pass corrected several items
here that the first draft had captured from an intermediate state of
`main`: item 2's reordering controls, item 3's placement, item 6's
selectability rule, and the "no separate Day step" claim, which is now
item 10. It also moved all touch/gesture/sheet chrome out to two new
specs, `mobile-app-shell-and-touch-ergonomics-v0.1.md` and
`mobile-gestures-reorder-and-swipe-v0.1.md`. This document proposes
changes; it does not implement anything.

**If `mobile-redesign` changes again before it merges** into the
prototype's `main`, re-check items 2, 6, and 10 first. Those are the
places the branch most recently diverged from `main`.

**How to read this document:** the prototype is a Lovable-built,
localStorage-backed mock with no real backend — it is read here purely
as **UX/behavior/copy evidence**, the same way `assignment-detail-cta-
hierarchy.md` and `daily-planning.md` already cite it, never as
implementation to port. Several things described below turn out to
already be built in this app, independently, sometimes in a materially
different (and more deliberate) shape than the prototype's own version —
those are called out explicitly as **Already covered** so this document
doesn't re-litigate settled decisions.

## Summary

Daily Planning, Assignment Detail's plan/finish CTAs, Today Execution's
finish CTAs, Home's Next card, Week Look-Ahead, and Activities all sit on
one connected journey — decide what to work on, place it in the day,
finish it, confirm it's really finished. The prototype has iterated
substantially on every joint in that journey since this app's specs were
last synced. This document separates what's already been solved here
(don't redo it) from what's genuinely new (propose it, increment by
increment, same as `docs/decisions/20260911-architecture-refactor-
proposal.md` and `docs/decisions/20260912-page-complexity-reduction-
proposal.md`'s own increment-at-a-time pattern).

## Source

Prototype: `src/routes/plan.tsx` (772 lines changed since baseline —
the largest single diff in this sync), `src/routes/today.tsx`'s
completion-adjacent parts (see `execution-coaching-v0.1.md` for the rest
of that file), `src/routes/assignments.$id.index.tsx`,
`src/routes/index.tsx`, `src/components/efc/LookAhead.tsx`,
`src/routes/activities.tsx`, `src/lib/domain/derive.ts`,
`src/lib/domain/store.tsx` (`reorderSessions`, `setSessionTime`,
`completeAssignment`), `src/lib/domain/types.ts`. On `mobile-redesign`,
also `src/components/efc/GestureRows.tsx` and
`src/components/efc/MobileSurface.tsx`, and
`src/routes/assignments.$id.index.tsx` / `assignments.$id.breakdown.tsx`
for the `?from=plan&date=` return context. The prototype's own
`.lovable/plan/*-2026-09-23.md` / `*-2026-09-24.md` notes give its
stated rationale for most items below and are quoted where useful.

## Already covered — do not re-propose

Confirmed by reading current production code and specs, not assumed:

- **Planning as one task without a breakdown.** `docs/decisions/
  20260816-plan-directly-without-breakdown.md`, implemented in
  `daily-planning.md`'s iteration 4 — "Plan '{title}' as one task
  instead" alongside "Break down ..." in `PlanPage.tsx`'s
  `BreakdownNotice`. This is the same *capability* as the prototype's
  "Plan it as one piece" button. The prototype has since moved *where*
  it's offered (off Plan, onto Assignment Detail only). See item 3.
- **"Already planned elsewhere" disclosure.** `daily-planning.md`
  iteration 3's "Also planned for {day}" indicator already matches the
  prototype's `plannedElsewhere` badge ("Planned Thu +1 more · 45 min").
  The separate "already planned *on this day*" case is new; see item 6.
- **4-step numbered wizard.** Select → Estimate → Schedule → Confirm,
  with no numbered Day step, matches the prototype
  (`docs/decisions/20260818-plan-day-step-removed.md`). **Correction to
  this document's first draft:** the prototype has *not* dropped a
  day-level screen altogether. It has a separate, un-numbered
  **existing-day view** that Plan lands on when the chosen day already
  has planned work. That view is not the old Day gate, and it partly
  reopens the 20260818 decision. See item 10.
- **Cross-day move for an already-planned item.** `daily-planning.md`
  iteration 4 FR-3's tap-based day picker already does this from Plan
  itself. (The prototype's equivalent — "Choose another day" inside its
  new repair flow — only appears from Today Execution's coaching system;
  see `execution-coaching-v0.1.md`. Different entry point, same
  capability; no gap here.)
- **In-progress session shows "Continue," not "Start."**
  `src/pages/home/NextCard.tsx:67` already does this.
- **Activity travel there / travel back as separate values.** Already
  built (`20260817120014_split_activity_travel_minutes.sql`). The first
  draft listed it as new; see item 9.
- **Assignment-target passthrough to Plan is already fully designed —
  just not yet built.** `docs/features/home-dashboard-followthrough.md`
  item 4 ("'Find time' passes the assignment through to Plan") already
  specs an optional `onGoToPlan(assignmentId?)` that pre-selects the
  target's open Work Items and forces `showAll`, with its own Acceptance
  Criteria. `assignment-detail-cta-hierarchy.md`'s Explicitly Out of
  Scope section defers this same gap for "Plan work for today." **This
  document recommends implementing that already-approved item as the
  foundation increment below, rather than re-designing it** — the
  prototype's `?assignment=<id>` search-param behavior is evidence the
  design direction was right, not a reason to redesign it.

## Proposed increments

### 1. Implement `home-dashboard-followthrough.md` item 4 (foundation)

No new design needed — implement the already-approved spec: `onGoToPlan`
gains an optional assignment-id target, used today only by "Find time";
Plan pre-selects that assignment's open Work Items and forces `showAll`
if needed. This document's remaining increments build on top of this
existing.

**Three refinements from the prototype, worth folding into that
implementation** (`plan.tsx`'s initial-load effect, plus commit
`744026a`, "Made CTA links navigate to planner"):

- **Pre-select only what still needs time.** Of the target assignment's
  open Work Items, pre-select those that are *not* already planned on
  the chosen day and *not* already planned on some other day on or
  before the assignment's due date. If that leaves nothing, fall back to
  pre-selecting all open items rather than landing on an empty
  selection.
- **Sort the target assignment first** in Select's candidate list and
  give its rows a subtle highlight ring. This makes the pre-selection
  visible, which matters if item 6 ends up removing the three-candidate
  truncation.
- **Both of Home's Needs Attention planning CTAs, "Find time" and "Make
  a plan", carry the target.** "Break it down" keeps opening Assignment
  Detail.
- **An assignment target skips item 10's existing-day view** and lands
  directly on Select, even if today already has planned work. The new
  items schedule after what's already planned, as "Add more work" does.
- **A work-item target (`?pick=`) wins over an assignment target** when
  both are present. It's used by item 3's "Plan it as one piece" and
  pre-selects exactly that one item.

**Acceptance Criteria (additions):**
- "Find time" for an assignment with three open steps, one of them
  already planned for tomorrow (before the due date), lands on Select
  with only the other two pre-selected.
- "Find time" for an assignment whose every open step is already planned
  pre-selects all of them rather than none.

### 2. Reordering and inline retiming in Plan and Week Look-Ahead

> **Implemented 2026-09-25** (tag `v-pre-session-reorder` marks the
> state before). Decisions settled in
> `docs/decisions/20260925-session-reorder-and-drag.md`:
> - **Weekend rule: option (a).** Activities (with travel) are obstacles
>   on every day. So **no `planOrder` is saved**: order stays derived from
>   start times, and a saved reorder writes only `startTime` for the
>   sessions whose time changed (one guarded update per session, sent
>   together, and not atomic; see the decision record).
> - **Past midnight: refused.** If a re-chained session would start at or
>   after midnight, nothing changes and "That order runs past midnight.
>   Try moving something to another day." is shown.
> - The chain starts at the earliest existing time, even one set by hand
>   before the first study window.
> - A manual retime is set with a **Set time** button, not on every
>   keystroke. An overlap names the earliest block it runs into (a session
>   title or an activity name).
> - No Domain Event is recorded for a reorder or retime (same as Move and
>   Remove).

**New, not currently specified anywhere in this app.** This app has no
session reordering today; `src/domain/reorder.ts`'s `moveItem` only
reorders draft steps inside `WorkBreakdownPage`. This item defines the
**behavior**: what reorders, what gets re-timed, what persists when.
The **interaction chrome** (drag handles, the Earlier/Later fallback,
the per-session edit sheet) is specified once, for every list, in
`mobile-gestures-reorder-and-swipe-v0.1.md`, and should not be
re-specified here.

**What changed between `main` and `mobile-redesign`.** On `main`,
reordering was a pair of small up/down chevrons on each row, and
retiming was a row of time chips plus a time input shown inline under
every planned session. On `mobile-redesign`:
- Reordering is a **drag handle** on each row. **Earlier / Later**
  buttons remain as the non-drag fallback, inside the session's edit
  sheet.
- Retiming, Earlier/Later, and "Remove from this day" all move into a
  **per-session edit sheet**, opened by a 44×44 px "Edit {title}"
  button on the row. The rows no longer show inline chips.
- The row itself shows the start time, bold, above the duration, so
  a student can scan the day without opening anything.

This document's first draft described `main`'s version. Build the
`mobile-redesign` version.

**Behavior to replicate:**

- **Three reorderable lists:** the Schedule step's not-yet-confirmed
  items, item 10's existing-day view, and each day in Week Look-Ahead.
  All three share one mechanism, not three implementations. Only
  `planned` sessions can be reordered or removed. `in_progress` and
  `done` sessions stay where they are and act as fixed obstacles.
- **Re-chaining after a reorder.** After any reorder, every planned
  session is re-timed in its new order. The first one starts at the
  earliest start time the group already had (or at the day's normal
  schedule start if none had a time). Each later one starts right
  after the one before it. If a session would overlap an `in_progress`
  or `done` session that day, it moves to just after that session.
  When the cursor passes the end of one of the day's study windows (the
  `studySlots` ranges, which already leave out activity time), it jumps
  to the start of the next window. That is how activities are avoided:
  the chain doesn't check activities directly. **This app difference
  needs a decision:** here, weekend `studySlots` deliberately returns
  no windows (`student-preferences.md`; see `study-hours-v2-proposal.md`
  §2). So on a weekend the chain has no windows to stay within and would
  only avoid other sessions, which means it could run straight through
  a Saturday activity. Before implementing, pick one: (a) treat
  activities (plus travel) as explicit obstacles in the chaining
  function on every day, not only through windows, or (b) don't re-chain
  on days with no windows; keep existing times and only change the
  order. Option (a) is safer. Durations use each session's
  current estimate (see `execution-coaching-v0.1.md` for current vs.
  original estimate). The prototype's `chainTimes` and `reorderSessions`
  show the algorithm's shape. They're evidence of the rule, not code to
  port. The rule belongs in `src/domain/` as a pure function with its own
  unit tests.
- **When the new order is saved.**
  - **Saved day** (existing-day view, Look Ahead): the new order and the
    re-chained start times save **immediately** on drop, as one write
    (`startTime` for every affected session; see the note above, since
    no `planOrder` exists).
  - **Schedule step draft**: order and times are held in memory until
    Confirm, as the Schedule step already does.
- **Retiming a single session** (edit sheet: suggested chips from
  `studySlots`, plus a manual `<input type="time">`). Chips that would
  overlap another busy block that day are shown disabled. A manual time
  that overlaps is refused with an inline, dismissable message ("That
  time overlaps with '{title}'. Pick a different start."), and the
  session's time doesn't change. The app never silently double-books
  and never silently clamps to the nearest free slot.
- **Removing a session from a day** keeps today's behavior (no
  confirmation). Only the trigger moves: it's now in the edit sheet
  and behind swipe-to-reveal (see the gestures spec).

**Acceptance Criteria:**
- A student can reorder two planned sessions on the same day without
  leaving the day view. The sessions after the moved one re-time to stay
  contiguous and non-overlapping, and the change survives navigating
  away and back.
- Reordering in the Schedule step re-chains the draft times shown on
  screen, and nothing is written until Confirm.
- In-progress and done sessions can't be dragged, can't be moved by
  Earlier/Later, and are never re-timed by a reorder. Planned sessions
  chain around them.
- Picking a suggested chip or a free manual time in the edit sheet
  updates the session immediately. A conflicting manual time shows the
  overlap message and leaves the time unchanged. Conflicting chips are
  disabled.
- The same reordering is available from Week Look-Ahead for any day in
  its range, using the same domain function as Plan.
- The re-chaining function has unit tests for: no existing times,
  a busy block in the middle, and a session whose re-chained start would
  run past midnight. For that last case, the prototype wraps the clock
  (`% 24`). **Don't replicate that.** *Resolved: the reorder is refused
  with a message and nothing changes (`rechainTimes` returns null).*
- *(Added 2026-09-25.)* On a day with no study windows, a reorder still
  chains around that day's activities and their travel time.

### 3. "Plan it as one piece" moves to Assignment Detail, the single place for breakdown choices

**Moves an already-built capability. Needs product sign-off, because it
changes where `docs/decisions/20260816-plan-directly-without-breakdown.md`'s
capability is offered.** Today, "Plan '{title}' as one task instead"
appears only inside `PlanPage.tsx`'s `BreakdownNotice`. The prototype
went through two steps on 2026-09-23:

1. First it matched Plan's inline prompt to Home's coaching voice ("This
   one is easier to start in smaller steps. Would it help to break it
   down? What do you think should happen first?", with **Yes, help me
   start** / **Plan it as one piece**).
2. Then it **removed Plan's inline prompt entirely**. The reason, from
   `use-one-breakdown-experience-from-home-assignments-and-plan-2026-09-23.md`:
   "the assignment page is the single consistent place for the coaching
   message and breakdown choices." On Plan, an unbroken assignment's row
   now just opens Assignment Detail (item 4).

On Assignment Detail, "Plan it as one piece" now appears in **two
places**:
- as the third action on the breakdown-nudge card (with "Yes, help me
  start" and "Just add a step"), shown when
  `workItems.length === 0 && effortMinutes > 45`, and
- as the third action in the **"No steps yet" empty state** (with
  "Break this down" and "Just add a step"), shown for *any* assignment
  with zero steps, including small ones of 45 minutes or less that
  never get the nudge.

Tapping it creates one Work Item named after the assignment, with the
assignment's full estimate. It then routes into Plan's Select step with
that item pre-selected (`?pick=<workItemId>`; see item 1). If the
student came from Plan, it returns to the same day (item 4).

**Proposed decision:** follow the prototype and remove the one-task
option from `BreakdownNotice`, so Detail is the only place it's offered.
The capability recorded in the 20260816 decision survives in full; only
its location changes. That needs a short decision record superseding
the placement part of 20260816, not a silent edit.

**Acceptance Criteria:**
- The breakdown-nudge card on Assignment Detail offers "Yes, help me
  start", "Just add a step", and "Plan it as one piece". The condition
  is unchanged (`workItems.length === 0 && effortMinutes > 45`).
- The "No steps yet" empty state on Assignment Detail offers "Break this
  down", "Just add a step", and "Plan it as one piece" for any assignment
  with zero steps.
- Tapping "Plan it as one piece" creates exactly one Work Item and lands
  on Plan's Select step with that item already chosen. If Detail was
  opened from Plan, it lands on the day Plan was showing.
- Plan's Select step no longer offers an inline break-down / plan-as-one
  prompt. Unbroken assignments are handled as described in item 4.

### 4. Select step surfaces "no steps yet" and "all steps done" assignments, not just open Work Items

**New behavior, not a copy tweak.** Today, Select's candidate list is
built purely from open Work Items — an assignment with zero Work Items
never appears there at all (a student would only discover it needs
breaking down via `BreakdownNotice`, a separate section), and an
assignment whose Work Items are all complete simply disappears from
every list once its last item finishes (nothing on Plan ever asks "is
the assignment itself actually done?"). The prototype's Select step now
lists these two states as their own rows, interleaved with normal
open-item candidates, sorted the same way:

- **No steps yet:** a row showing the assignment title, "Not broken into
  steps yet · {course} · {due}", and the assignment's overall estimate.
  The row is a *link* to Assignment Detail, not a selectable checkbox
  row. Decomposition and "Plan it as one piece" happen on Detail (item 3).
- **All steps done, assignment still open:** a row reading "All steps
  done · {course} · {due}". Tapping it expands, inline, "Every step here
  is done. Is the whole assignment finished?" with **Mark it complete**
  and **Add another step**. "Add another step" opens Assignment Detail.
  Marking it complete shows the "mark it turned in at school" reminder
  (item 5).

The prototype keeps these two cases separate on purpose
(`finishing-an-assignment-when-all-its-steps-are-done-2026-09-23.md`).
An earlier version lumped "all steps done" in with "never broken down"
and wrongly offered to break down an assignment that was really
finished.

**The same all-done prompt appears on Assignment Detail.** When every
step is complete and the assignment is still open, Detail shows a card
under its Steps list: "Every step here is done. Is the whole assignment
finished?" with **Yes, mark it complete** (then the item 5 reminder)
and **Not yet — add a step** (opens the inline add-step form). The
existing ghost "Mark assignment complete" button further down stays as
it is. Put the "has steps, none open, not complete" check in one pure
domain helper (the prototype calls it `isAssignmentFinishable`) and use
it for Plan, Detail, and Today Execution's completion check
(`execution-coaching-v0.1.md`).

**Return-to-Plan context.** When Detail or the breakdown flow is
opened from Plan, the student should come back to Plan on the **same
day** they were planning. This applies to Back, Cancel, finishing a
breakdown, "Plan it as one piece", and "Got it" on the turned-in
reminder. When Detail is opened from Home or Assignments, it keeps its
current destinations. The prototype does this with `?from=plan&date=`
search params. **In this app, Back is already covered:** Assignment
Detail is a global overlay (`docs/decisions/20260817-assignment-detail-
global-overlay.md`), and Plan's date is lifted into `App.tsx`, so
closing Detail already reveals Plan on the same day. What's not covered
is the *forward* exits (breakdown confirmed, "Plan it as one piece",
turned-in "Got it"), which today go to Detail or Assignments. Those need
to know the origin. Pass it as an explicit origin argument through the
existing overlay props. Don't introduce URL routing for this.

**Acceptance Criteria:**
- An assignment with no Work Items appears in Select's candidate list as
  a distinct row linking to Assignment Detail, not silently absent.
- An assignment whose Work Items are all complete but which is itself
  still open appears in Select as a distinct "All steps done" row, never
  labelled "Not broken into steps yet".
- Assignment Detail shows the all-done card under the same condition, and
  its two actions behave as described above.
- Marking it complete from Select or Detail shows the same turned-in
  reminder as completing it from Today Execution.
- Opening Detail from Plan, then confirming a breakdown, choosing "Plan
  it as one piece", or dismissing the turned-in reminder, returns to Plan
  on the day that was showing. Opening Detail from Assignments and doing
  the same returns to Assignments, as today.

### 5. "Mark it turned in at school" reminder after completing an assignment

**New, not currently specified.** Wherever an assignment transitions to
complete — Assignment Detail's own "Mark assignment complete," the new
all-done prompt in item 4 above, or Today Execution's last-step
completion (see `execution-coaching-v0.1.md`) — show one interstitial
before returning to wherever the student came from:

> **One last thing** — Nicely done — "{title}" is marked complete here.
> Remember to also mark it as turned in or complete in whatever your
> school uses to track assignments.
> [Got it]

This reflects a real gap this app doesn't currently address at all:
"complete" in this app only ever means "I'm done working on it," never
"I turned it in," and those are genuinely different facts a student
needs to track separately at most schools.

**Acceptance Criteria:**
- Completing an assignment by any path shows this reminder exactly once
  before returning to the originating screen (Assignment Detail →
  Assignments list, or Plan on the same day if Detail was opened from
  Plan (item 4); Plan/Today Execution → back to where the student was
  planning/working).
- The reminder is a full-screen step ("One last thing" eyebrow, "Mark it
  turned in at school" title, one **Got it** button), not a dismissable
  sheet. Both `main` and `mobile-redesign` render it full-screen on
  Detail and Today, so it can't be swiped away unread.
- The reminder's copy is identical regardless of which path triggered
  completion.

### 6. Select: full list, "Planned today" note, and same-day items disabled — two explicit decisions

> **6b and 6c implemented 2026-09-25** with item 10: they became
> prerequisites once confirm appends. The disabled row keeps full text
> contrast (a dashed border and the note, not the prototype's 60%
> opacity), and the note is the row's `aria-describedby`. **6a** (drop the
> three-candidate cap) is still undecided.

Three related changes to how Select handles work that's already on the
chosen day. Two of them reverse an existing criterion or the
prototype's own earlier stance, so they're flagged for decision rather
than adopted silently.

**6a. No three-candidate truncation. Needs a decision.**
`daily-planning.md`'s Acceptance Criteria currently require: *"Select
never shows more than three candidates without an explicit 'show more'
action."* The prototype removed the cutoff and its "Show more
assignments" link. Every open task and upcoming assignment now shows
immediately, in due-date order. Its stated reason
(`make-add-more-work-clearer-2026-09-23.md`) is the "Add more work" path:
a student adding to an existing day needs to see everything that's
left, not a sample. Since then, two more reasons have appeared that
make the prototype's direction stronger than this document's first
draft allowed:
- Item 4 adds two new row kinds (no steps yet, all steps done) to the
  same list. A three-row cap can now hide a row that needs attention.
- Item 1's pre-selection has to be visible. That's why the target
  assignment is sorted first, but with a cap, other pre-selected
  assignments' rows could still end up hidden.

**Revised recommendation:** adopt the full list, *on the condition
that* item 1's "target first" sort ships with it. Replace the
existing criterion rather than leaving it contradicted. This is still
a product call (choice overload vs. hidden work), so record it in a
short decision record either way.

**6b. "Planned today · {N} min" note. Adopt.** A task that already has
an unfinished session on the chosen day shows a primary-colored note
with a calendar icon: "Planned today · 30 min", or "Planned this day ·
30 min" when the chosen day isn't today. It sits alongside the existing
muted "Planned {Thu} +1 more · 45 min" note for other days (see Already
covered). This way "already on this day" and "already on another day"
look different.

**6c. Same-day tasks disabled. Needs a decision, because the prototype
reversed itself here.** On `main`, `make-add-more-work-clearer`
explicitly said: *"Keep already-planned tasks selectable, since a
student may intentionally schedule another work session for the same
task."* On `mobile-redesign`, commit `d62db3e` ("Disabled same-day
tasks") does the opposite. A task with an unfinished session on the
chosen day is now **disabled** in Select (`disabled`, 60% opacity,
`cursor-not-allowed`) and can't be added a second time for that day.
The branch's commit history doesn't say why. The likely reason is that
the existing-day view (item 10) is now where a student changes that
session's time or length, so a second session for the same task on the
same day is almost always an accident.

**Recommendation:** follow `mobile-redesign` and disable same-day tasks,
because it prevents accidental double-booking and the existing-day view
covers the legitimate "more time on this" case (edit the session).
Two accessibility requirements the prototype doesn't meet:
- A disabled row must still say *why*. The "Planned today · {N} min"
  note (6b) does that visually. Also tie it to the row with
  `aria-describedby`, so the row isn't announced as just "dimmed,
  unavailable".
- The dimmed row must still meet WCAG 1.4.3 text contrast. WCAG exempts
  inactive controls, but this row carries real information the student
  needs. Check the 60% opacity rendering, and don't rely on opacity
  alone to show the disabled state.

**Acceptance Criteria:**
- (6a, if adopted) Select shows every candidate without a "show more"
  action, in due-date order, with an item-1 target assignment first.
  `daily-planning.md`'s three-candidate criterion is replaced, not left
  contradicted.
- (6b) A task with an unfinished session on the chosen day shows
  "Planned today · {N} min" (or "Planned this day · {N} min"), visually
  distinct from the other-day note.
- (6c, if adopted) That same task can't be selected for the chosen day.
  Its row says why in a way screen readers can reach, and selecting it
  from another day is unaffected.

### 7. Home's Next card: reflect in-progress state and a late start

**Small, additive.** `NextCard.tsx` already shows "Continue" instead of
"Start" once a session is `in_progress` (see Already covered). Two
things it doesn't do yet:

- The eyebrow label ("Next") becomes "Working on" once the session is
  `in_progress`.
- If a planned session's start time has passed by 45+ minutes and it's
  still `planned` (not started), a calm line appears — "You had planned
  to start this earlier." — and the button reads "Start now" instead of
  "Start," with a secondary "Change the plan" action linking to Plan.
  Language is deliberately never "late."

**Acceptance Criteria:**
- Next card's eyebrow reads "Working on" while the session is
  `in_progress`, "Next" otherwise.
- A planned session more than 45 minutes past its start time shows the
  "You had planned to start this earlier" line, a "Start now" button,
  and a "Change the plan" secondary action; a session within 45 minutes
  of its start time, or already started, shows neither.

### 8. Week Look-Ahead: per-assignment "still needs a plan" messaging

**Copy/behavior refinement.** Today, a day with due assignments and no
plan yet shows one generic line ("Preparation still needs a plan"). The
prototype lists each specific unplanned assignment by name ("{title}
still needs time in your plan.") — and only for assignments that
genuinely have no time set aside anywhere between now and their due
date, not just "nothing planned on this specific day." Only surfaces
within the existing 2-day lookahead window this app already uses for
that warning.

**Acceptance Criteria:**
- A day within the 2-day warning window with an unplanned due assignment
  lists that assignment's title in the warning, not a generic sentence.
- An assignment that already has time scheduled on an earlier day (even
  if not on this specific day) is not listed as needing a plan.

### 9. ~~Activities: split travel time to/from~~ — already built; withdrawn

**Correction to this document's first draft, which proposed this as new.**
This app already stores and shows travel there and travel back
separately. Migration
`supabase/migrations/20260817120014_split_activity_travel_minutes.sql`
added `travel_to_minutes` / `travel_from_minutes`, and
`activityService.ts` and `ActivitiesPage.tsx` use them ("+{n}m there ·
+{n}m back"). Nothing to do. The only remaining Activities changes come
from `mobile-redesign`: swipe-to-reveal Delete, and day toggles raised
to at least 44 px. Both are specified in
`mobile-gestures-reorder-and-swipe-v0.1.md` and
`mobile-app-shell-and-touch-ergonomics-v0.1.md` §5. The number is kept
so references to items 10+ stay stable.

### 10. Existing-day view: Plan opens on the day's plan when one exists

> **Implemented 2026-09-25** (tag `v-pre-existing-day-view` marks the
> state before). As built, the spec below is refined by the two decision
> records above:
> - **Confirm appends** rather than replaces (the blocking finding in
>   analysis: replace would have deleted the existing plan on "Add more
>   work"), and new work's default times start *after* the day's last
>   session, skipping activities.
> - **"Looks good" lands on the day view** with "Plan confirmed." and,
>   for today, a **Start today's plan** button at the top of the view.
>   It isn't in the action bar, which holds Add more work / Done and
>   would overflow at 320 px.
> - **Landing is decided at render time:** `Step` gained `"day"`,
>   meaning the chosen day's landing view. Picking a day, confirming,
>   and fresh entries use it. Add more work, Assignment Detail's "Plan
>   work for today", and Home's Needs Attention actions go straight to
>   Select.
> - **The edit sheet** holds Move to another day and Remove for now.
>   Retime and Earlier/Later arrive with item 2 (roadmap step 10).
>   Started sessions are read-only in the day view, like done ones.
> - **Removing or moving the day's last session** keeps the (now empty)
>   day view, rather than switching to Select underneath the student.

**Partly reopens `docs/decisions/20260818-plan-day-step-removed.md`.
Needs product sign-off.** Source:
`tapping-a-day-in-look-ahead-opens-that-day-s-plan-2026-09-23.md`,
later restyled on `mobile-redesign`.

**The problem it solves, in the prototype's words:** "tapping a day in
Look Ahead drops you into the planning flow at 'What should you work
on?' — as if the day had nothing on it. If the day already has work
planned, it should show that plan first and let you change it." This
app has the same shape. Its `AlreadyPlannedList` sits at the top of
Select, above "What should you work on?". The plan is visible, but the
screen still opens as a "pick new work" screen.

**What the prototype does.** Plan gains an un-numbered `"day"` view.
It's not one of the four wizard steps, and it shows no "Step N of 4"
chip. Plan lands on it **only when the chosen day already has
unfinished sessions**. That applies on first load, when picking a day
from the day chips, and when tapping a day in Look Ahead. An empty day
still goes straight to Select, exactly as today. An item-1 target
(`?assignment=`/`?pick=`) always skips the day view. The view shows, in
order:
- A heading, "Today's plan" or "Your plan for {long date}", with the
  capacity phrase on the right.
- "Due: {title}" links for anything due that day (these open Assignment
  Detail), and that day's activities ("{start}–{finish} · {name}").
- The day's sessions, done ones included, as scannable rows: title,
  assignment/course line, bold start time above the duration, and an
  "Edit {title}" button that opens item 2's edit sheet. Planned rows can
  be dragged and swiped (`mobile-gestures-reorder-and-swipe-v0.1.md`).
  Done rows are read-only.
- A sticky action bar with **Add more work** (primary), which clears any
  wizard draft and goes to Select for the same day with existing
  sessions intact, and **Done** (ghost), which goes to Look Ahead.
- "Nothing planned for this day yet." if the student removes the last
  session while on the view.

**Why this doesn't bring back what 20260818 removed.** That decision
removed a *mandatory gate*: a Day screen in front of Select on every
entry, including empty days where it had nothing to offer. The
existing-day view never appears for an empty day and never appears for
a targeted entry. It only replaces Select as the landing screen when
there's a real plan to manage. The 20260818 decision's own complaint
("an unnecessary extra tap") doesn't apply, because a student opening a
day that's already planned usually wants to see or adjust that plan,
not add to it.

**What happens to `AlreadyPlannedList`.** Once this ships, Select no
longer needs its own copy of the day's plan. The "Planned today" note
(item 6b) covers that job inside Select. Its "Move to another day" panel
(`daily-planning.i04.md` FR-3) moves into item 2's edit sheet, next to
Earlier/Later, retime, and Remove. The prototype has no cross-day move
in the sheet, because it only reaches cross-day moves through Today
Execution's repair flow. This app already has the capability, so keep
it.

**Proposed decision:** adopt, with a short decision record that
supersedes 20260818 points 2 and 4 (Select's header content, and
`pickDay()` landing) for days that already have a plan, and leaves the
rest of that decision in place.

**Acceptance Criteria:**
- Opening Plan (tab, Look Ahead day tap, or day chip) on a day with at
  least one unfinished session lands on the existing-day view. On a day
  with none, it lands on Select, as today.
- An item-1 targeted entry always lands on Select, even if the day has
  a plan.
- The view lists due-today assignments, activities, and every session
  for that day. Planned sessions can be reordered (item 2) and edited or
  removed through the edit sheet. Done sessions are read-only.
- "Add more work" goes to Select for the same day without clearing
  existing sessions. The new work is scheduled after them.
- "Done" goes to Look Ahead.
- Moving a session to another day is available from the edit sheet,
  with the same capacity warning `daily-planning.i04.md` FR-3 already
  shows.

## Flagged for resolution alongside `study-hours-v2-proposal.md`

> **Resolved 2026-09-25:** `PROTECTED_MINUTES` is retired
> (`study-hours-v2-proposal.md` §3, option b), matching the prototype.

The prototype's capacity formula (`availableMinutes`) no longer
subtracts `PROTECTED_MINUTES` (currently a fixed 90 minutes, `src/
domain/studyCapacity.ts:21`, applied to both weekday and weekend) at
all. On weekdays this is arguably folded into the new configurable
"done by" boundary; on weekends, it's genuinely gone with no
replacement. `daily-planning.md`'s own Functional Requirements name this
protected block explicitly, tied to Design-Principles.md's Eighth
Principle, "Protect What Matters." **Do not silently drop this** —
resolve it explicitly as part of `study-hours-v2-proposal.md` (which
already touches the same formula for its own reasons), not as an
incidental side effect of this document's other increments.

## Domain Model Touchpoints

- Planning → Planning Session, Plan, Availability, Work Session (ordering
  via `planOrder`, once-committed `plannedMinutes` vs. student-revised
  `currentEstimateMinutes` — the latter is `execution-coaching-v0.1.md`'s
  concern, not this document's, but the two share the same session
  record).
- No new Domain Events beyond what a `session_moved`/`session_rescheduled`-
  shaped observation already covers conceptually — reuse this app's
  existing Domain Event patterns rather than inventing new ones for
  reordering/retiming. (The prototype records one `session_moved`
  observation per drag-reorder, carrying the date and item count, not
  one per session re-timed.)
- Assignment completion: one pure "finishable" rule (has steps, none
  open, not yet complete) shared by Plan, Detail, and Today Execution.

## Explicitly Out of Scope (this proposal)

- Anything in the friction/coaching system, the cross-day/cross-
  assignment "is the whole task/assignment done" prompts on Today
  Execution's completion path, automatic elapsed-time capture, or
  revised-estimate display — see `execution-coaching-v0.1.md`.
- Course color/deletion — see `course-management-v2-proposal.md`.
- The Saturday/Sunday study-hours split and the `PROTECTED_MINUTES`
  question above — see `study-hours-v2-proposal.md`.
- The prototype Settings screen's dev-only "Reset with example data" /
  "Clear all data" testing affordances — QA/demo tooling for a
  localStorage-backed prototype, not a real feature for students; not
  proposed here or anywhere in this sync.
- The **interaction chrome** for reordering and removal (drag handles,
  swipe-to-reveal, overflow menus, the Earlier/Later fallback, the
  sheet itself). **Correction to the first draft**, which said the
  prototype doesn't use drag: `mobile-redesign` does, via `@dnd-kit`.
  That chrome is specified in `mobile-gestures-reorder-and-swipe-v0.1.md`
  and `mobile-app-shell-and-touch-ergonomics-v0.1.md`. This document
  owns only the ordering, re-timing, and persistence rules.
- Sticky Back / Next / Confirm action bars on each wizard step, and the
  "Step N of 4" chip moving up beside the title. These are
  presentation-only and are covered by
  `mobile-app-shell-and-touch-ergonomics-v0.1.md` §4.
