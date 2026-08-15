# Observations — Iteration 1

Derived from `findings.yaml` and `report.md` in this directory.

## What the persona attempted

Alex (9th grader, first time using the app) logged in, found the gear
icon on Home (the only non-sign-out control available), and landed on the
new Courses screen. He tried to add "Algebra I," got an unreadable error,
tried once more with a slightly different name, got the same error, then
went back to Home to see if it had saved anyway before giving up.

## What was observed

- Every request to `courses` (list and insert) returns HTTP 403.
  `public.courses` has correct RLS policies but no explicit `GRANT` to the
  `authenticated` role — local Supabase's `auto_expose_new_tables` default
  is off, so PostgREST denies the request outright rather than RLS
  filtering rows. (`i01-02-courses-after-failed-add.png`)
- The resulting error reaches the student as a raw `alert("[object
  Object]")`, because `useCourses.ts`'s fallback does `String(error)` on a
  non-`Error` object instead of reading `.message`.
- The add-course input clears itself even when the save fails, giving a
  false "it worked" signal alongside the alert's "something's wrong"
  signal.
- A failed initial fetch renders identically to a genuinely empty course
  list — no distinct error state.

## Why it matters

The feature as built is completely non-functional on the local stack —
not a UX rough edge but a hard blocker. Compounding that, even once the
403 is fixed, two independent bugs in the same error path would still
give students misleading feedback on any future failure (network blip,
validation error, etc.), and the raw `[object Object]` text actively
erodes trust rather than informing.

## Evidence

- `screenshots/i01-01-home-initial.png`
- `screenshots/i01-02-courses-after-failed-add.png`
- `screenshots/i01-03-home-after-abandon.png`
- `transcript.md`
- `findings.yaml` — FINDING-IS-001 through FINDING-IS-006

## Suggested improvement

1. Add explicit `grant select, insert, update on public.courses to
   authenticated;` to the migration (FINDING-IS-001).
2. Read `.message` off any error-like object rather than falling back to
   `String(error)` (FINDING-IS-002).
3. Only clear the add-course input on confirmed success (FINDING-IS-003).
4. Give the initial fetch a distinct error state instead of reusing the
   empty-state copy (FINDING-IS-004).

FINDING-IS-005 (no assignment-creation path) and FINDING-IS-006 (gear icon
was discoverable) are recorded for completeness but are out of scope for
course-setup's own iteration decision — the former belongs to
`assignment-capture.md`, the latter is a weak positive signal, not a
defect.
