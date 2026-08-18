# Feature: Daily Planning

**Status:** Implemented and merged to `main` (2026-08-16), after four
development iterations on `experiment/daily-planning` (see
`docs/playwright/daily-planning/` and
`docs/features/iterations/daily-planning/`). The five-step wizard,
capacity math, and confirm flow described below are built and tested
against this spec's Acceptance Criteria. Iterations 2–4 added behavior
beyond this spec's literal text, driven by iterations 1–3's
persona-assessment findings and, for iteration 4, direct product-owner
review rather than an assessment:

- A signal and a direct routing path when a candidate assignment hasn't
  been broken into Work Items yet, instead of Select silently
  dead-ending (iteration 2), later extended to also cover the case where
  only *some* of a day's candidates need it (iteration 3).
- A "Plan '{title}' as one task instead" alternative to breaking an
  assignment down, for assignments that aren't meaningfully decomposable
  — see `docs/decisions/20260816-plan-directly-without-breakdown.md`.
- Selecting a work item already planned on a different day is allowed,
  not blocked, with an informational (not warning-styled) "Also planned
  for {day}" indicator (iteration 3, tone softened in iteration 4).
- The Schedule step's suggested times and manual entry now share one
  directly-editable time input, rather than a separate display-only
  selection state shown alongside a duplicate manual field (iteration 4
  FR-1).
- A "Move to another day" action on an already-planned item, doing a
  single create-on-target-day-then-remove-from-original action instead
  of requiring the student to plan it again elsewhere and separately
  delete the original (iteration 4 FR-3). This is a tap-based day
  picker, not the drag-and-drop mechanism this spec's own Explicitly Out
  of Scope section rules out below — that exclusion still holds.
- Wizard day/step selection now survives switching to another bottom-nav
  tab and back mid-session (iteration 2 FR-2).

**Fix (2026-08-17):** Select's fully-empty state (no open assignments at
all, distinct from the "needs breakdown" case above) had copy and a
missing action carried over from that sibling case rather than written
for its own — see the Amendment near the end of this document.

Confirming a plan still shows an inline success acknowledgment rather
than navigating to Today Execution or Week Look-ahead directly — this was
correct when written (neither existed yet), but Today Execution has since
shipped (`docs/Roadmap.md` Phase 4) without that follow-up navigation
change ever landing; the Confirm step's "Start today's plan" button is
today's only path from Plan into Today Execution, one tap later than the
spec's own "confirming navigates to..." wording implies. See
`docs/decisions/20260816-daily-planning-confirm-write-order.md`'s
Consequences for this outstanding follow-up. Week Look-ahead remains
genuinely unbuilt. Moving a session is limited to the existing 5-day
(Today+4) window and to `planned`-status sessions; anything involving
Week Look-ahead's own date range, or Today Execution's in-progress/done
statuses, is deferred to those features.

## Summary

The core Planning Session workflow: the student reviews what's open,
chooses what to work on for a given day, estimates time honestly, places it
around their actual commitments, and confirms a plan they own. Target:
under five minutes end to end (Product-Vision.md, Playwright-Test-Personas.md).

## Source

Prototype: `src/routes/plan.tsx`, `src/lib/domain/derive.ts`
(`availableMinutes`, `studySlots`, `estimationDrift`).

## User Story

As a student, I want to decide — quickly and realistically — what I'm doing
today, so I'm not guessing or re-deciding all evening.

## UX Flow

A single screen with a five-step internal flow (step indicator: "Step N of
5"), plus a day picker strip (today + next 4 days, and a "Look ahead"
tab — see [week-lookahead.md](week-lookahead.md)):

1. **Day** — shows what's due that day, existing commitments (Activities)
   for that day, and anything already planned for it (with a remove
   option). States remaining capacity in plain language: "That leaves
   about {X} of study time." Continue.
2. **Select** — "What should you work on?" Shows only the **three highest-
   priority candidate Work Items** (soonest-due first) to avoid choice
   overload, with a "Show more assignments" link to reveal the rest. Each
   candidate shows its parent assignment and course for context (never
   just an isolated work-item title). Multi-select via checkbox-style
   toggle.
3. **Estimate** — for each selected item, adjust the planned time in 5-
   minute increments from its default estimate. Running total: "Selected:
   {X}" plus, while under capacity, "about {Y} still available." If a
   student has a documented pattern of underestimating similar work
   (`estimationDrift`), show one gentle coaching note quantifying it and
   inviting reconsideration — never a warning tone. This note is a
   passive, read-only precursor to metacognition-reflection.md's Moment D
   (periodic pattern review); that future loop should evolve from this
   signal rather than being built as a parallel mechanism. If the selection
   exceeds capacity, show a calm, non-alarming statement of the fact
   ("This is {X} more than you have that day. That is worth knowing now
   rather than at 10pm.") — the student can still proceed; the app states
   reality, it does not block.
4. **Schedule** — suggested time slots computed from the day's actual open
   stretches (around Activities + travel time), pre-assigned in order but
   editable; a manual time input is always available as an escape hatch.
   Framed explicitly as suggestions ("Move anything that does not fit your
   day.").
5. **Confirm** — ordered list of the day's plan with times, a total vs.
   capacity summary, "Adjust" (back to select) or "Looks good."

Confirming navigates to Today execution if planning today, or back to Week
look-ahead if planning a future day.

**Update (2026-08-18):** Day is no longer a separate step — its content
(due-that-day, Activities, Already planned, capacity sentence) now
renders unconditionally as Select's own header, with no "Continue" gate
in front of Select's candidate list. The wizard is 4 steps, not 5 ("Step
N of 4"); Select is step 1, Estimate 2, Schedule 3, Confirm 4. The
day-picker strip itself is unaffected — it was already rendered above
every step, not owned by Day, which is exactly what made Day's remaining
content (this list's old item 1) foldable into Select with nothing lost.
See `docs/decisions/20260818-plan-day-step-removed.md` for the full
reasoning and consequences.

## Functional Requirements

- Capacity = the day's realistic study window (shorter on weekends'
  earlier start / weekdays' later start) minus Activities (+ their travel
  time) minus a fixed protected block reserved for rest/family/downtime —
  never presented to the student as "free time," and never fully
  consumable by planning (Design-Principles.md Eighth Principle, "Protect
  What Matters").
- Candidates are open Work Items only (assignment not completed, item not
  completed), sorted by parent assignment's due date.
- Confirming a plan replaces that day's *not-yet-started* planned sessions
  (in-progress/done sessions are left alone) and records a Planning
  Session (items planned, minutes planned) — a Domain Event
  (`Plan Confirmed`), not silently mutated state.
- The student can remove an individual already-planned item without
  restarting the whole flow.

## Acceptance Criteria

- A student can complete a full planning session, start to confirm, in
  under five minutes.
- Select never shows more than three candidates without an explicit
  "show more" action.
- Every work item shown anywhere in this flow displays its parent
  assignment and course — never a bare item title.
- No unexplained progress indicators — only the explicit "Step N of 4"
  label (see 2026-08-18 update above — was "of 5" before Day merged into
  Select).

## Domain Model Touchpoints

- Planning → Planning Session, Plan, Availability, Work Session.
- Domain Services: Planning Service, Scheduling Service.
- Domain Invariant: "The student owns the Plan" — nothing here becomes
  part of the Plan until "Looks good."

## Explicitly Out of Scope (this increment)

- Editing a session's course/assignment scope from within planning (that
  lives in Assignment Management).
- Cross-day drag-and-drop rescheduling.

No deviations from the prototype are proposed for this feature.

## Amendment: correct Select's fully-empty-state copy and add an escape hatch

Raised 2026-08-17. Select has two distinct "nothing to work with" states,
and the fully-empty one was shipped (iteration 2) with copy and behavior
copied from its sibling rather than written for itself:

- **Assignments exist but need breaking down** — `BreakdownNotice`/
  `BreakdownList`, unaffected by this amendment. Offers "Break down" and
  "Plan '{title}' as one task instead."
- **No open assignments at all** — previously reused that case's own
  framing ("Break an assignment into steps first, then come back."),
  which makes no sense when there is nothing to break down, and offered
  no action at all — a dead end, contrary to this application's "never a
  dead end" empty-state convention (see Home's and Assignments' own empty
  states).

### Decision

For the fully-empty case only:

- Corrected copy: "Nothing to plan yet." / "Add an assignment, then come
  back."
- An "Add assignment" button, routing to the Assignments tab (`onGoToAssignments`,
  the same tab-switch shape `HomePage` already uses for its own "Nothing
  coming up" empty state) rather than opening inline capture — Plan has no
  capture UI of its own, and adding one was judged out of proportion to
  this fix. Full inline capture from within Plan remains a candidate for a
  future increment if it turns out to matter in practice.

### Acceptance Criteria (additive)

- When a student has no open assignments at all, Select shows "Nothing to
  plan yet." / "Add an assignment, then come back." with a visible "Add
  assignment" action — never the breakdown-flavored copy, and never a bare
  empty state with no action.
- Tapping "Add assignment" switches to the Assignments tab.
- The "needs breakdown" case's own copy and actions are unchanged by this
  amendment.
