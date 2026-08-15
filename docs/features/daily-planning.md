# Feature: Daily Planning

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
- Step 2 never shows more than three candidates without an explicit
  "show more" action.
- Every work item shown anywhere in this flow displays its parent
  assignment and course — never a bare item title.
- No unexplained progress indicators — only the explicit "Step N of 5"
  label.

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
