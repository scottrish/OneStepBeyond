# Feature: Home Dashboard Follow-Through

## Summary

Five related fixes to how Home's own actions continue once tapped,
surfaced by direct product-owner review of the built experience (same
category of input as `daily-planning.md` iteration 4's "direct
product-owner review rather than an assessment" — see
`docs/features/observations.md` for the full running list this was
drawn from). Each item amends a specific existing spec rather than
introducing new screens — see that item's own "Amends" line for exactly
which; between them this spec touches `home-dashboard.md`,
`risk-detection.md`, `daily-planning.md`, `assignment-management.md`, and
`today-execution.md`.

The shared theme: an action started on Home should carry its context
forward rather than dropping the student into a generic screen and
making them re-find what they just asked for.

## Source

No prototype reference — these are fixes to this codebase's own already-
built (post-prototype) behavior, identified through use, not ported.

---

## 1. Home discloses all of today's relevant work, not just the single most prominent item

**Amends:** `home-dashboard.md` (Next card and Needs Attention,
UX Flow items 2 and 4), `risk-detection.md` (Acceptance Criteria).

Two separate gaps under one principle, per clarification: "Next" and
"Needs Attention" each surface exactly one item as if it were the whole
picture, with the rest either a click away (Next) or entirely
unreachable (Needs Attention).

### 1a. Next card: today's remaining planned tasks are visible, not just counted

**Problem:** the only hint that more is planned today is a small "Today's
plan: about {X} · {N} tasks · View plan" line beneath the Next card —
easy to miss, and even when noticed, requires leaving to Plan to actually
see what those tasks are.

**Decision:** reuse Today Execution's own already-built pattern for
exactly this: a compact "After that" list (title + duration only, not
expanded) showing every other not-done session for today, directly below
the Next card. `TodayExecutionPage.tsx` already computes this today as
`activeSessions.slice(1)`; Home's version is the same computation over
its own `todaySessions`. This is additive — the existing "Today's plan:
... · View plan" summary line stays, since it still carries the total
time and the explicit link into Plan for actually editing the day; "After
that" answers "what else is there" without a tap, "View plan" remains
how to change it.

**Functional Requirements:**
- The list excludes the session already shown as Next and any already
  `done`, matching `TodayExecutionPage`'s own `upNext` filter exactly —
  one shared notion of "what's left today," not two.
- Rows are read-only previews (title + duration), not independently
  tappable — consistent with how `TodayExecutionPage`'s own "After that"
  behaves today. Acting on a specific later task still means starting
  from the top (via Next, once it becomes current) or via "View plan."

**Acceptance Criteria:**
- With two or more sessions planned for today, every one beyond the
  current Next item is visible directly on Home, with no tap required.
- With exactly one task planned, Home looks as it does today (no empty
  "After that" heading with nothing under it).

### 1b. Needs Attention: every qualifying item can be seen and acted on

**Problem:** `home-dashboard.md`/`risk-detection.md` both currently cap
Needs Attention at exactly one item ("never more than one... always the
soonest-due"), by original design, to avoid an anxiety-inducing stack of
warnings. In practice this hides real information with no recovery path:
a second qualifying assignment is not just visually de-emphasized, it's
completely unreachable from Home, and — checked directly — Risk
Detection isn't wired into the Assignments list either
(`docs/Roadmap.md`'s Backlog already tracks this gap), so leaving Home
for Assignments wouldn't even reveal *which* assignments need attention
or why. There is currently no way to act on a second flagged assignment
without independently rediscovering it.

**Decision:** keep the soonest-due item exactly as today — full message
text and its own action button, still the visually dominant element.
Render every additional qualifying assignment as a compact secondary row
directly beneath it: title plus its own action button (same three
labels — "Break it down"/"Find time"/"Make a plan" — no separate message
text, to keep these visually lighter than the primary card). No artificial
cap on how many secondary rows render; `assignmentsNeedingAttention`'s
own logic and sort order are otherwise unchanged. If this turns out to
produce a genuinely long list in practice, capping with a "+N more"
overflow is a cheap, small follow-up — not worth building pre-emptively
against a case that may not occur (YAGNI).

This is a real change to `risk-detection.md`'s and `home-dashboard.md`'s
existing "never more than one" acceptance criterion, not just an
implementation gap — worth reading that criterion's own rationale
(reduce cognitive load / avoid a wall of warnings) against this decision
before treating it as settled. The concrete usage complaint here is that
the original cap doesn't reduce anxiety so much as hide real, actionable
risk; this decision resolves that in favor of visibility, keeping only
the *visual weight* imbalanced (one full card, N compact rows) rather
than the *information* itself capped.

**Functional Requirements:**
- Every item from `assignmentsNeedingAttention`'s full result array is
  rendered — index 0 as today's full card, the rest as compact rows in
  the same (soonest-due-first) order.
- Each row's action button calls the same `handleAttentionAction`
  already used for the primary item, parameterized by that row's own
  `AttentionItem` — including item 4 below's "pass the target through"
  behavior when a row's action is "find-time."

**Acceptance Criteria:**
- With two assignments both qualifying, both are visible on Home, each
  with its own working action button — no need to leave Home, and no
  need to already know a second one exists.
- With exactly one qualifying assignment, Home looks exactly as it does
  today.

---

## 2. Needs Attention "Break it down" routes through Plan, not Assignment Detail

**Amends:** `risk-detection.md` (Next action routing), `home-dashboard.md`
(Needs Attention section).

### Problem

Needs Attention's "Break it down" action (`HomePage.tsx`'s
`handleAttentionAction`) currently calls `onOpenAssignment`, opening
Assignment Detail, where the student must separately find and tap
"Break this down" to reach `WorkBreakdownPage` — two taps, and no option
to instead plan the assignment as one task, unlike the equivalent
situation reached through Plan (`PlanPage.tsx`'s `BreakdownNotice`,
offering "Break down ..." and "Plan ... as one task instead" side by
side, in one tap).

### Decision

Change Needs Attention's "break-it-down" action to call `onGoToPlan`
(the same call "find-time" and "make-a-plan" already use), instead of
`onOpenAssignment`. No new UI is built: `PlanPage.tsx`'s Day step already
computes `assignmentsNeedingBreakdown` as *every* open assignment with
zero Work Items, unconditionally — the flagged assignment is
automatically part of that set and the notice already renders both
choices without any special-casing for how the student arrived. This
also means item 2 in this spec doesn't need item 4's "pass the target
through" mechanism — `BreakdownNotice` shows every qualifying assignment
at once (unlike Select's candidate list, which truncates), so nothing
needs highlighting or pre-selecting to make the target visible.

### Functional Requirements

- `AttentionItem["action"] === "break-it-down"` now calls `onGoToPlan()`
  with no target argument.
- Landing on Plan via this path lands on the Day step (Plan's own
  default), where `BreakdownNotice` is already showing.

### Acceptance Criteria

- Tapping "Break it down" from Needs Attention and tapping "Break down
  ..." from Plan's own Day step produce the identical screen and choice
  set — because they're now the same code path, not because two
  implementations were kept in sync by hand.
- The "Plan ... as one task instead" alternative is available from the
  Needs Attention entry point for the first time.

---

## 3. Assignment Detail's own "Break this down" gets the same two-choice offer

**Amends:** `assignment-management.md` (Assignment Detail's breakdown
entry point), `daily-planning.md` (source of the reused component).

### Problem

Unlike item 2 above, Assignment Detail's *own* "Break this down" /
"Edit breakdown" button (reached directly from the Assignments list,
Home's Coming Up, or Plan's due-list "Due:" link — not via Needs
Attention) has no sensible "route elsewhere" fix, since the student
explicitly acted from within Detail and expects the result there. It
currently goes straight to `WorkBreakdownPage` with no "plan as one task
instead" alternative at all (this is also observation #7 from
`observations.md`'s Assignments section — the same underlying gap,
resolved by the same fix).

### Decision

Extract `PlanPage.tsx`'s `BreakdownList` (the two-button-per-assignment
component: `assignments`, `onBreakdown`, `onPlanDirectly`,
`planningAssignmentId` — currently page-local, ~40 lines, not exported)
into a shared component. `AssignmentDetailPage` renders it with a
single-element array (`[assignment]`) in place of today's single
"Break this down" button, wired to the same `workBreakdownService
.confirmWorkBreakdown(studentId, assignment, [], [...], 0)` call
`planWithoutBreakdown` already uses in `PlanPage.tsx`, followed by
`refetchAssignment()`/`refetchWorkItems()` so Detail's own Steps section
reflects the new single item immediately. `BreakdownNotice`'s own
wrapping copy ("N assignments need to be broken into steps...") stays
Plan-specific and unexported — only the button pair is shared, since
Assignment Detail's context (one assignment, already being viewed) needs
no such framing sentence.

`PlanPage.tsx` itself is updated to import the extracted component
rather than keep its own copy, so there is exactly one implementation.

### Functional Requirements

- The extracted component takes the same props `BreakdownList` already
  has today — no behavior change to Plan's own three existing usages
  (Day step, Select step, the all-candidates-need-it dead end).
- `AssignmentDetailPage`'s "Break this down"/"Edit breakdown" button is
  replaced by the extracted panel when the assignment has zero Work
  Items; once any Work Item exists, "Edit breakdown" still goes straight
  to `WorkBreakdownPage` as today (the two-choice offer only applies to
  the *first* breakdown decision, matching Plan's own behavior).

### Acceptance Criteria

- From Assignments, Home's Coming Up, or Plan's due-list link, tapping
  into Assignment Detail for an assignment with no Work Items shows both
  "Break down ..." and "Plan ... as one task instead," matching Plan's
  own wording and layout exactly.
- Confirming "Plan as one task instead" from Assignment Detail updates
  that same screen's Steps section immediately (no navigation required
  to see the result), the same way it already updates Plan's own list.

---

## 4. "Find time" passes the assignment through to Plan

**Amends:** `home-dashboard.md`, `risk-detection.md` (next-action
routing), `daily-planning.md` (Select step arrival).

### Problem

"Find time" (`onGoToPlan()`, no arguments) lands on Plan's Day step with
no memory of which assignment triggered it. The student has to tap
Continue to reach Select, then re-locate the assignment among candidates
— which may not even be in the first three shown before "Show more."

### Decision

`onGoToPlan` gains an optional target: the assignment id (only ever
supplied by "find-time," since `risk-detection.ts` guarantees
`items.length > 0` — i.e. Work Items already exist — whenever that
action is chosen, so a schedulable candidate always exists). When
supplied:

- Plan lands directly on the **Select** step (skipping Day), for
  `date = today`.
- Every one of the target assignment's open Work Items is pre-selected
  (added to `chosen`, matching `toggleCandidate`'s existing default-
  estimate behavior) — the student can immediately proceed to Estimate,
  or deselect if that's not actually what they want.
- `showAll` is forced true if the target's candidates would otherwise be
  hidden behind "Show more assignments" — the point is that the student
  never has to hunt, regardless of due-date ranking.

### Functional Requirements

- This threading only applies to "find-time" — "make-a-plan" (the third
  next-action) continues to call `onGoToPlan()` with no target, per its
  own spec (Plan generally, not one specific unscheduled item).
- The pre-selection is a starting point, not a lock — the student can
  deselect/adjust exactly as they can any other candidate.

### Acceptance Criteria

- Tapping "Find time" lands the student on Select with the flagged
  assignment's work already checked and visible, zero additional taps
  to reach that state.
- The Estimate/Schedule/Confirm steps behave identically whether items
  were pre-selected this way or chosen manually — no new code path
  through the rest of the wizard.

---

## 5. Home's "Start" starts the session, not just navigates

**Amends:** `home-dashboard.md` (Next card), `today-execution.md`.

### Problem

Home's Next card "Start" button only sets `executingToday = true`
(navigates to Today Execution); the session is still `status: "planned"`
when Today Execution mounts, so its own current-task card shows its own
"Start" button for the identical task — two taps for what reads as one
decision.

### Decision

Home's "Start" button transitions the session to `in_progress`
(`workSessionService.updateWorkSessionStatus(next.id, "in_progress")` —
the same transition `useTodayExecution`'s own `start` performs) and
*then* navigates to Today Execution, same as today. This is not a
change to the Today Execution model — Today Execution already renders a
session that's `in_progress` on arrival correctly (that's the ordinary
state immediately after its own "Start" is tapped mid-session); Home is
just performing that same transition one screen earlier; the direct
service call is a plain read-then-write, consistent with this
codebase's existing simple-write style elsewhere (no new hook needed —
`useDailyPlanning`, which Home already uses, doesn't own session-status
transitions today, and doesn't need to; a bare service call is enough
for a single fire-and-forget status update). If the update fails, Home
still navigates to Today Execution as it does today — the student lands
on a session still showing "Start" there, a safe, visible fallback
rather than a dead end on Home.

### Functional Requirements

- Only the Next card's own "Start" button changes; nothing about
  `TodayExecutionPage`'s own actions (Done/Need more time/I'm stuck)
  changes.
- The status transition is fire-and-forget from Home's perspective —
  Home does not block navigation on the network call succeeding.

### Acceptance Criteria

- Tapping "Start" on Home's Next card, then landing on Today Execution,
  shows the current task's Done/Need more time/I'm stuck actions
  immediately — never a second "Start" button for the same task.

---

## Domain Model Touchpoints

- No new entities. Item 5 uses the existing Work Session Started event
  (`today-execution.md`) one screen earlier than today. Items 2–4 are
  navigation/UI-composition changes over already-modeled data
  (Assignment, Work Item, Availability).

## Explicitly Out of Scope (this increment)

- Item 1b's secondary rows gaining their own message text, or a cap plus
  "+N more" overflow — both are deferred until real usage shows they're
  actually needed (see item 1b's own Decision).
- Item 1a's "After that" rows becoming independently tappable (e.g.
  jumping straight into a specific later task) — read-only preview only,
  matching `TodayExecutionPage`'s own version.
- Any change to `assignmentsNeedingAttention`'s own selection or sort
  logic — item 1 is purely about disclosing the existing result set,
  not changing which assignment is chosen as "the" primary one.
- Extending item 4's target-passing mechanism to "make-a-plan" — that
  action's own spec is about the day generally, not one item.
- Any change to `WorkBreakdownPage` itself — item 3 changes what leads
  into it, not the breakdown flow.
