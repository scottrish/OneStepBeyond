# Observations — Iteration 2

Derived from `findings.yaml` and `report.md` in this directory.

## What the persona attempted

Alex returned to the same starting point (Home → gear icon → Courses)
and created three sample 9th-grade courses (Algebra I, Biology, English
Literature), then discovered and used the tap-to-rename affordance on
Biology. He then checked Home for a way to add an assignment.

## What was observed

- Every course-setup operation succeeded on the first try: list load,
  three creates, one rename. No errors, no alerts, no console errors.
  (`i02-02-first-course-added.png`, `i02-03-three-courses.png`,
  `i02-04-rename-fixed.png`)
- All four of iteration 1's implementation defects (FINDING-IS-001
  through FINDING-IS-004) are resolved — confirmed live for the two that
  this run's success path could exercise (load/create), confirmed via
  targeted unit tests for the two error-path fixes that weren't
  triggered live (nothing failed this run to trigger them).
- The list updating immediately was sufficient confirmation — no
  confusion about whether an add or rename had worked.
- No path to assignment creation exists yet (FINDING-IS-005) — unchanged
  from iteration 1, still out of scope for course-setup.

## Why it matters

This confirms `course-setup.i02.md`'s acceptance criteria are met: a
student can create a course and see it appear with no error, a failed
save preserves input instead of silently clearing it, and a failed fetch
would show a distinct state rather than the empty-state copy (per unit
tests, not re-observed live since nothing failed this run).

## Evidence

- `screenshots/i02-01-home-initial.png` through `i02-05-home-no-assignment-path.png`
- `transcript.md`
- `findings.yaml` — FINDING-IS-001 through FINDING-IS-004 marked
  resolved; FINDING-IS-005/006 still open/informational; FINDING-IS-007
  new (full workflow completed with no friction).

## Suggested improvement

None for course-setup this iteration. FINDING-IS-005 (assignment
creation) is tracked separately under `assignment-capture.md`, not
course-setup's own next increment.
