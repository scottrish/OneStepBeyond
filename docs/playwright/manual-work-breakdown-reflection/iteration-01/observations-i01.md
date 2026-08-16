# Observations — Iteration 1

Derived from `findings.yaml` and `report.md` in this directory. This
assessment closes the one process gap identified in the Phase 1–3 gap
audit before starting Phase 4 (Daily Planning / Today Execution /
Week Look-Ahead): Manual Work Breakdown + Reflection was the only
student-facing Phase 1–3 feature that had shipped without an
independent synthetic persona assessment.

## What the persona attempted

Alex set up two sample assignments (a small, concrete one and a big,
vague Biology project), broke the vague one into concrete steps via
"Break this down," tested both cancelling and confirming a revision to
an already-confirmed breakdown, completed the assignment, and answered
(then genuinely skipped a follow-up to) the resulting reflection
question — covering every part of the mission's completion condition.

## What was observed

- "Break this down" was discovered immediately with no hesitation.
  (`i01-02-project-detail-break-this-down.png`)
- The bottom-nav "Assignments" tab is a no-op while nested in Assignment
  Detail reached from the Assignments list — the same bug class as
  `assignment-management`'s previously-fixed FINDING-AM-001, on a
  different tab. The Home-tab fix (`App.tsx`'s `homeResetKey`) was never
  generalized. (`i01-06-assignments-tab-noop.png`)
- Work Breakdown totals that don't land on one of the app's 8 fixed
  effort presets display as raw minutes ("150 min") instead of the
  app's usual "1h"/"45m" formatting — a common case for any multi-step
  breakdown, not an edge case. (`i01-04-step3-review-150min.png`)
- Confirming a breakdown silently overwrites the assignment's original
  estimate with the derived total, with no on-screen acknowledgment
  that this happened — spec-compliant (§5 "Assignment Estimated
  Effort") but genuinely confusing in the moment.
  (`i01-05-confirmed-effort-updated.png`)
- Cancelling an in-progress edit correctly discarded a real added step;
  re-confirming afterward cleanly replaced the old breakdown with no
  duplicates — verified both on screen and directly against the
  database (two `decomposition_attempts` rows, exactly 4 final
  `work_items`). (`i01-08-cancel-preserved-original.png`,
  `i01-09-revised-confirmed.png`)
- The reflection follow-up's "Skip" produced no nagging or second
  prompt. (`i01-10-reflection-question.png`,
  `i01-11-completed-with-reflection.png`)

## Why it matters

One real implementation defect (FINDING-WB-001, high severity,
reachable on a common path: open any assignment from the Assignments
list, then tap the Assignments tab). Two more findings are spec-
compliant but still real, evidenced friction for this persona
specifically (FINDING-WB-002 raw-minute formatting, FINDING-WB-003
silent estimate change). One low-confidence validation item
(FINDING-WB-004) flags an unspecified interaction — editing a completed
assignment's breakdown — worth a deliberate product decision rather
than leaving implicit. The core flow itself (create → estimate →
confirm, draft/cancel safety, clean revision replace, reflection with a
real skip) all worked as designed.

## Evidence

- `screenshots/i01-01-assignments-list.png` through
  `screenshots/i01-11-completed-with-reflection.png`
- `transcript.md`
- `findings.yaml` — FINDING-WB-001 through FINDING-WB-009

## Suggested improvement

- Fix FINDING-WB-001 by generalizing the `homeResetKey` remount pattern
  (or extracting a shared mechanism) to `AssignmentsPage.tsx`'s own
  nested `view` state.
- Give `src/domain/effortPresets.ts`'s `effortLabel()` a real duration
  formatter as its fallback instead of raw `"{minutes} min"`.
- Consider a lightweight on-screen acknowledgment when confirming a
  breakdown changes the assignment's estimated effort.
- Make a deliberate decision on FINDING-WB-004 (editing a completed
  assignment's breakdown) rather than leaving it unspecified.
