---
feature: assignment-management
iteration: 2
derived_from: docs/features/assignment-management.md
playwright_evidence: docs/playwright/assignment-management/iteration-01/
---

# Assignment Management — Iteration 2

## Assessment Summary

Iteration 1's persona assessment (Alex Carter / `evaluate-assignment-management`,
2026-08-15) found the core list/edit/complete/delete workflow working
cleanly, with one real navigation dead end: the bottom-nav "Home" tab does
nothing while the user is nested in an Assignment Detail screen reached
via Home's "+" button — the tab bar shows "Home" as active but the
on-screen content never changes. This is reachable on the most common
path through the app (capture an assignment, then try to navigate away)
and is fixed by this iteration. Two further points of friction were
observed that are spec-compliant but still risky/confusing for this
persona: instant, unconfirmed, unrecoverable deletes, and a "Remaining"
time figure that silently narrows to just itemized steps the moment a
first step is added. Full detail:
`docs/playwright/assignment-management/iteration-01/findings.yaml` and
`report.md`.

## Finding Dispositions

| Finding | Disposition | Reasoning |
|---|---|---|
| FINDING-AM-001 (Home tab no-op from nested Detail) | Implementation defect | `HomePage`'s internal navigation state isn't reset when the parent tab cycles away and back to "home," so the tab bar and the visible screen can disagree about where the user is. Bug fix, no new requirement. |
| FINDING-AM-002 (list clarity, no false progress bars) | Preserve | Matches assignment-management.md's UX Flow exactly. Captured as a design constraint. |
| FINDING-AM-003 (inline edit confirmation) | Preserve | Matches spec exactly. Design constraint. |
| FINDING-AM-004 (mark-complete confirmation) | Preserve | Matches spec exactly. Design constraint. |
| FINDING-AM-005 (instant delete, no undo) | UX improvement | The confirmation rule itself is correct per spec ("no completed steps → delete immediately"); the gap is the total absence of any recovery path after that instant delete. New requirement below. |
| FINDING-AM-006 ("Remaining" shrinks when a step is added) | UX improvement | `remaining effort is computed... from open Work Items' estimates when a breakdown exists" is correct and intentional per spec; the gap is that nothing on screen explains the switch from "assignment estimate" to "itemized so far." New requirement below. |
| FINDING-AM-007 (confirm-before-delete path unreachable) | Out of scope | Per assignment-management.md itself, per-step completion happens "during Today execution, not from this screen" — a separate, unbuilt feature. No action here; revisit once that feature ships. |

## Product Problems

**Problem A — Bottom-tab navigation can silently strand the user on Assignment Detail.**
Affected users: every student, on the very first assignment they ever
capture. Impact: the tab bar visibly disagrees with the screen content;
the only working way out is the in-page "← Back" button, which the user
must discover independently. Supporting: FINDING-AM-001. Existing
requirement (implicit — the app shell's tab bar is expected to always be
able to navigate); fix, no new requirement text.

**Problem B — Deleting an assignment offers no recovery.**
Affected users: any student who deletes an assignment with no completed
steps (the common case), especially one prone to fast, unread taps.
Impact: an accidental delete is permanent with zero warning and zero
recovery. Supporting: FINDING-AM-005. UX improvement — new requirement
(FR-1).

**Problem C — "Remaining" changes meaning without explanation.**
Affected users: any student who partially itemizes an assignment into
steps rather than all at once. Impact: the displayed remaining time drops
to reflect only itemized steps, which reads as the app having "lost"
track of the rest of the work. Supporting: FINDING-AM-006. UX
improvement — new requirement (FR-2).

## Functional Requirements

### FR-1 — Recoverable delete for assignments with no completed steps

When a student deletes an assignment that had no completed steps (the
immediate-delete path), the app must offer a short-lived way to reverse
the action — for example, a brief "Assignment deleted — Undo" affordance
shown immediately after the delete, available for a few seconds before
the deletion becomes permanent. This does not change the existing rule
that assignments with completed steps require an explicit confirmation
step before deleting; it only adds a recovery path to the no-confirmation
case.

Supporting findings: FINDING-AM-005.

### FR-2 — Distinguish assignment-level estimate from itemized-steps-remaining

When an assignment has at least one Work Item but its itemized steps do
not represent the full scope the student originally estimated, the UI
must not present the sum of open steps as if it were a full replacement
for the assignment's own estimate without any indication that the two
numbers can differ. At minimum, the assignment's own estimate must remain
visible or referenced alongside the itemized-remaining figure once any
step exists, so a partial breakdown is never presented as if the rest of
the assignment's time simply vanished.

Supporting findings: FINDING-AM-006.

## Design Constraints

- Preserve the Assignments list's existing per-item content exactly:
  course, due date, title, remaining-effort text, and a progress bar only
  when more than one Work Item exists. (FINDING-AM-002)
- Preserve inline edit's current behavior: a small in-place form,
  immediate visible confirmation on save, no navigation away from the
  list. (FINDING-AM-003)
- Preserve "Mark assignment complete"'s current behavior: unambiguous
  "Completed" state on Detail, immediate move into the list's "Finished"
  section. (FINDING-AM-004)

## Non-functional Requirements

- The fix for FINDING-AM-001 must not change `HomePage`'s existing
  internal capture/detail flow — only ensure the bottom tab bar and
  visible screen can never disagree about navigation state.

## Acceptance Criteria

- From any Assignment Detail screen reached via Home's "+", tapping the
  "Home" tab in the bottom navigation bar always navigates to the Home
  screen's default view.
- After deleting an assignment with no completed steps, an undo
  affordance is visible for a defined short window; using it restores the
  assignment with its data intact. After that window, the deletion is
  final.
- Once an assignment has at least one Work Item, the assignment's
  originally-estimated time remains visible or otherwise referenced on
  both the list and Detail screens, distinguishable from the sum of open
  steps' estimates.

## Out of Scope

- Per-step completion from the Assignment Detail screen (FINDING-AM-007)
  — belongs to the Today-execution/Planning feature, not this iteration.
- Any change to the confirmation-required delete path for assignments
  with completed steps — already correct per spec, unaffected by FR-1.

## Assumptions

- A short-lived undo affordance (FR-1) is sufficient recovery; a full
  trash/archive with indefinite retention is not required by this
  iteration's evidence.

## Open Questions

- Exact undo window length (FR-1) — iteration 1's evidence doesn't
  specify a duration; left to implementation judgment, consistent with
  Design-Principles.md.
- Exact presentation of the two time figures in FR-2 (e.g. both numbers
  shown, or a single figure with a "of {estimate} total" qualifier) —
  left to implementation judgment.

## Human Validation Recommendations

- After FR-1/FR-2 and the FINDING-AM-001 fix land, a human should
  manually verify the Home-tab repro (capture an assignment, tap the
  bottom-nav Home tab) before re-running the persona assessment, per
  iteration 1's report.md.

## Evidence Traceability

| Requirement | Supporting Findings |
|---|---|
| FR-1 | FINDING-AM-005 |
| FR-2 | FINDING-AM-006 |
| (defect fix, no FR) | FINDING-AM-001 |
| (design constraint, no FR) | FINDING-AM-002 |
| (design constraint, no FR) | FINDING-AM-003 |
| (design constraint, no FR) | FINDING-AM-004 |
| (out of scope, no FR) | FINDING-AM-007 |
