# Observations — Iteration 1

Derived from `findings.yaml` and `report.md` in this directory.

## What the persona attempted

Alex started fresh (zero courses, zero assignments), tapped "+" on Home
first (before the gear), was redirected to add a course since none
existed, added three sample courses, then successfully captured a real
assignment (Algebra I / "Worksheet 12" / default due date / 45m effort).
After saving, he checked both Home and Courses to see if the new
assignment showed up anywhere else.

## What was observed

- The full capture form worked with zero errors: course selection, title,
  due-date default (tomorrow), effort chips (default 30m, switchable),
  optional notes, and save all behaved exactly as specified.
  (`i01-04-capture-form.png`, `i01-05-assignment-detail.png`)
- The "+" button was immediately understood as "add something new" even
  with a second icon (gear) present. (`i01-01-home-initial.png`)
- Reaching the capture form with no courses yet showed a clear redirect
  ("Add one first...") rather than a dead end.
  (`i01-02-new-assignment-empty-courses.png`)
- After saving, neither Home nor Courses shows any trace of the new
  assignment — only the detail screen shown immediately after Save
  displays it. (`i01-06-home-after-save.png`, `i01-07-courses-check.png`)

## Why it matters

Zero implementation defects this iteration — a direct result of applying
course-setup's lessons up front (GRANT shipped with the migration,
error-handling pattern reused). The one real finding (FINDING-AC-005) is
the expected, already-scoped gap: Home's "Coming up" and an Assignments
list both depend on features not yet built
(`home-dashboard.md`, `assignment-management.md`). This assessment
confirms the friction is felt exactly where the Step 1 scope decision
predicted, and gives concrete persona evidence supporting the Roadmap's
existing choice to build `assignment-management.md` next.

## Evidence

- `screenshots/i01-01-home-initial.png` through `i01-07-courses-check.png`
- `transcript.md`
- `findings.yaml` — FINDING-AC-001 through FINDING-AC-005

## Suggested improvement

None for `assignment-capture.md` itself — see `docs/features/assignment-capture.md`'s
own "Explicitly Out of Scope" section, which already defers this.
FINDING-AC-005 is evidence supporting the Roadmap's existing sequencing,
not a new requirement for this feature.
