# Feature: Assignment Management

**Status:** Implemented (2026-08-15), merged to `main` via
`experiment/assignment-management` after two development iterations (see
`docs/playwright/assignment-management/`). The Assignments list and
Assignment Detail screen are built and tested: view, inline edit,
complete, and delete, matching this spec's Acceptance Criteria. Iteration
2 added two behaviors beyond this spec's literal text, driven by
persona-assessment findings: a brief "Undo" affordance after an
unconfirmed delete (no completed steps), and the Detail/list screens now
always show the assignment's own estimate alongside the itemized-steps
remaining total once any step exists, rather than one silently replacing
the other.

**Update (2026-08-17):** the confirmation-required delete path (an
assignment with at least one completed step) is now reachable through
real UI, not just tested code — Today Execution shipped and marks a Work
Item's `completedAt` when its session is marked Done. The "Plan work for
today" action and the Assignment Brief/"What this needs" card remain
unbuilt, but their original blocker no longer holds: Daily Planning and
Risk Detection both now exist. What's actually blocking them is a design
question, not a missing dependency — see `docs/Roadmap.md`'s Backlog item
"Assignment Detail's CTA hierarchy needs reconsidering, not just
completing," which also now covers wiring in Risk Detection here (also
built, also not yet consumed by this screen). The Assignment Brief/
"What this needs" card still depends on Assignment Understanding & Guided
Breakdown, not yet started.

**Update (2026-08-17):** Assignment Detail is no longer reachable only
from this feature's own Assignments list. It's now a global overlay owned
by `App.tsx`, reachable from Home (Needs Attention, Coming Up, and
straight after capturing a new assignment) and from Plan's Day step
"Due:" list, with the same delete/Undo behavior regardless of entry
point — see `docs/decisions/20260817-assignment-detail-global-overlay.md`.
This spec's own UX Flow and Acceptance Criteria are unaffected (Detail's
own behavior didn't change), but "reached from the Assignments list" in
the sections below should be read as "reached from anywhere an assignment
is displayed."

## Summary

View, edit, complete, and delete Assignments. Covers the Assignments list
and the Assignment Detail screen (minus the breakdown/coaching flow, which
is its own feature).

## Source

Prototype: `src/routes/assignments.index.tsx`,
`src/routes/assignments.$id.index.tsx`.

## User Story

As a student, I want to see everything I have due, open any one of them to
see what's left, and correct or remove things that changed.

## UX Flow

### Assignments list

- Open (incomplete) assignments sorted by due date ascending, each showing:
  course color dot + name, due date, title, and remaining-effort text.
- If the assignment has a structured breakdown (more than one Work Item),
  show "`{done} of {total} steps complete · about {remaining} left`" with a
  thin progress bar. If it does not, show only "`About {remaining} left`"
  — **no progress bar when there is no meaningful progress data to show**
  (avoids implying false precision).
- Completed assignments collapse into a separate "Finished" section,
  title struck through, no actions.
- Inline edit (pencil icon) turns a card into a small form (title, due
  date, estimate, notes) without navigating away.
- Delete (trash icon): if the assignment has zero completed steps, delete
  immediately. If it has completed steps, confirm first — completing steps
  represents real work and observation history that deletion would erase.
- Empty state: "No assignments yet." / "Tap + to add your first one." with
  a direct action button (never a dead end).

### Assignment Detail

- Title, course, due date, description/notes (if any).
- If an Assignment Brief has been confirmed (see the breakdown feature),
  show a "What this needs" card listing deliverables/requirements, marking
  system-inferred items with "(my guess)" so a guess is never presented as
  a teacher requirement.
- Progress bar + percentage, "`{remaining} of work left · you estimated
  {total} in total`".
- If this assignment currently needs attention, show why (see
  [risk-detection.md](risk-detection.md)).
- If it has no Work Items yet and its estimate exceeds 45 minutes, offer a
  coaching prompt suggesting a breakdown (does not force one).
- Steps (Work Items) list, each with a completion checkbox (read-only here
  — completion actually happens during Today execution, not from this
  screen) and its own estimate. "Add another step" lets the student add
  one more item directly, without going through the full breakdown flow.
- Primary actions: "Plan work for today" (→ Planning) and "Mark assignment
  complete" (marks the assignment and any remaining open steps complete in
  one action).
  **Open item (`docs/Roadmap.md`'s Backlog, raised 2026-08-16):** "Plan
  work for today" was never built (deferred pending Daily Planning, which
  now exists), leaving "Mark assignment complete" as the screen's only,
  overly-dominant primary action — including for an assignment that was
  just created and never worked on. Before restoring the missing button,
  reconsider "Mark assignment complete"'s own prominence: it's a "record
  already-done or unplanned work" action in an app that's a planning
  tool, not a tool for recording unplanned work.
- Edit / delete mirror the list screen's behavior and confirmation rule.

## Functional Requirements

- Editing an assignment records an `assignment_updated` observation.
- Deleting an assignment cascades: removes its Work Items, any Work
  Sessions referencing those items, any Reflections tied to those items,
  and its Assignment Brief/decomposition episodes if present. Records
  `assignment_deleted`.
- Completing an assignment marks it and all incomplete Work Items complete
  in the same action, and records `assignment_completed`.
- Remaining effort is computed, not stored: from open Work Items' estimates
  when a breakdown exists, otherwise from the assignment's own estimate.

## Acceptance Criteria

- A student can identify what's left on any assignment without leaving the
  Assignments list (remaining-effort text) or after one tap (Detail).
- Progress bars only ever appear when there is more than one Work Item.
- Deleting an assignment with completed steps requires confirmation;
  deleting one with no completed steps does not.

## Domain Model Touchpoints

- Commitments → Assignment; Planning → Work Item.
- Domain Invariant: "An Assignment and its Work Breakdown are separate
  concepts" — reflected in Detail showing the Brief (what's expected)
  distinctly from Steps (how the student plans to do it).
- Domain Events: `Assignment Updated`, `Assignment Captured` predecessor.

## Explicitly Out of Scope (this increment)

- Reordering or bulk-editing Work Items from this screen (drag/reorder).
- Any parent- or coach-visible view of this data (deferred increment, see
  `docs/decisions/20260813-student-only-first-increment.md`).

No deviations from the prototype are proposed for this feature.
