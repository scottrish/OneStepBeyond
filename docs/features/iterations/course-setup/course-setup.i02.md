---
feature: course-setup
iteration: 2
derived_from: docs/features/course-setup.md
playwright_evidence: docs/playwright/course-setup/iteration-01/
---

# Course Setup — Iteration 2

## Assessment Summary

Iteration 1's persona assessment (Alex Carter / `evaluate-initial-setup`,
2026-08-14) found the feature completely non-functional: every request to
`courses` returned HTTP 403 because the table's RLS policies exist but no
explicit `GRANT` was made to the `authenticated` role. On top of that
blocker, two independent bugs in the error-handling path gave the student
actively misleading feedback (a raw `"[object Object]"` alert, and an
input that clears itself even when the save failed), and a failed initial
fetch is visually indistinguishable from a genuinely empty course list.
Full detail: `docs/playwright/course-setup/iteration-01/findings.yaml`
and `report.md`.

## Finding Dispositions

| Finding | Disposition | Reasoning |
|---|---|---|
| FINDING-IS-001 (courses 403) | Implementation defect | Violates course-setup.md's acceptance criterion "a student can create a usable course with just a name, in a few seconds" — the spec is correct, the migration is missing a GRANT. Bug fix, no new requirement. |
| FINDING-IS-002 (`[object Object]` alert) | Implementation defect | `useCourses.ts`'s fallback (`String(error)` on a non-`Error` object) is simply wrong, not a spec gap — the evident intent was to show `error.message`. Bug fix, no new requirement. |
| FINDING-IS-003 (input clears on failed save) | Implementation defect | `handleAdd` clears the field unconditionally instead of only on success — a logic bug, not a design question. Bug fix, no new requirement. |
| FINDING-IS-004 (failed fetch looks like empty state) | Specification gap | course-setup.md's Empty State section defines only the zero-courses case; it never addresses a load failure. The implementation matches the (incomplete) spec. New requirement below. |
| FINDING-IS-005 (no assignment-creation path) | Out of scope | Belongs to `docs/features/assignment-capture.md`, not course-setup — no action here. |
| FINDING-IS-006 (gear icon discoverable) | Preserve | Positive signal, low confidence (it was the only control available). Captured as a design constraint, not new functionality. |

One additional disposition beyond the six findings: the underlying pattern
behind FINDING-IS-002 — using a blocking native `alert()` for any error at
all — is also a **UX improvement** opportunity independent of the string-
coercion bug. Fixing the fallback text alone would still leave students
seeing a jarring modal dialog for routine failures, which
Design-Principles.md's "Design for Calm" principle argues against. New
requirement below.

## Product Problems

**Problem A — Course data operations are blocked outright.**
Affected users: every student, on first use. Impact: total feature
failure. Supporting: FINDING-IS-001. Existing Requirement (implicit in
the Acceptance Criteria); fix, no new requirement text.

**Problem B — Error feedback misleads rather than informs.**
Affected users: any student who hits a save or load failure, now or in
the future. Impact: the current failure signals (raw object text,
self-clearing input, indistinguishable empty state) actively point the
student in the wrong direction rather than just being unhelpful.
Supporting: FINDING-IS-002, FINDING-IS-003, FINDING-IS-004. Mixed
disposition — 002/003 are defects (fixed below, no new requirement);
FINDING-IS-004 is a genuine spec gap (new requirement, FR-1); the general
alert()-pattern is a UX improvement (new requirement, FR-2).

**Problem C — Settings entry point.**
Supporting: FINDING-IS-006. No gap — existing requirement, already
correctly specified and observed working. Captured as a design
constraint only.

## Functional Requirements

### FR-1 — Distinct error state on a failed course list fetch

When the initial course list fetch fails, the Courses screen must show a
state distinguishable from "the student genuinely has zero courses" —
for example, an inline message such as "Couldn't load your courses. Try
again." with a retry action, instead of silently rendering the empty-state
copy.

Supporting findings: FINDING-IS-004.

### FR-2 — Replace `alert()`-based error surfacing with an in-page state

Errors from course creation and renaming must be shown as an in-page,
dismissible message near the action that failed, not a native `alert()`
dialog. The message must read the underlying error's actual text (see the
FINDING-IS-002 bug fix below) — this requirement is about *where and how*
the error appears, not what it says.

Supporting findings: FINDING-IS-002.

## Design Constraints

- Keep the header gear icon as the entry point to Courses. When future
  settings items (e.g. Activities) are added alongside it, preserve a
  single, unambiguous tap target rather than splitting settings across
  multiple entry points. (FINDING-IS-006)
- The empty-state copy and immediately-visible add form (course-setup.md's
  existing requirement) worked as intended and should not change.

## Non-functional Requirements

- The `courses` table must be reachable by the `authenticated` role for
  select/insert/update, consistent with its RLS policies (this is the
  FINDING-IS-001 fix — an infrastructure correctness requirement, not new
  product behavior).

## Acceptance Criteria

- A student can create a course and see it appear in the list within the
  same session, with no error, against a freshly reset local Supabase
  stack.
- When a course save fails, the input field retains the student's typed
  text (it is not cleared) and an in-page message states that the save
  failed.
- When the initial course list fetch fails, the screen shows a message
  distinguishable from "No courses yet" — verifiable by simulating a
  fetch rejection and confirming the empty-state copy is not shown.
- No error surfaced to the student ever displays the literal text
  `[object Object]`.

## Out of Scope

- Assignment creation (FINDING-IS-005) — tracked under
  `assignment-capture.md`, not this iteration.
- Any new course-setup functionality beyond fixing iteration 1's defects
  and closing the FR-1/FR-2 gaps above (no color picker, no delete, per
  the original spec).

## Assumptions

- The local Supabase stack's `auto_expose_new_tables` default (off) is
  the correct baseline to build against going forward, not a local-only
  quirk to work around differently in this migration vs. a future hosted
  project.

## Open Questions

- Should the FR-2 in-page error message auto-dismiss, or require explicit
  dismissal? Iteration 1's evidence doesn't inform this — flagged for
  human judgment during implementation rather than blocking on it.

## Human Validation Recommendations

- After FR-1/FR-2 and the three implementation-defect fixes land, a human
  should manually verify one real create → list → rename round trip
  against the local stack before re-running the persona assessment, per
  iteration 1's report.md.

## Evidence Traceability

| Requirement | Supporting Findings |
|---|---|
| FR-1 | FINDING-IS-004 |
| FR-2 | FINDING-IS-002 |
| (defect fix, no FR) | FINDING-IS-001 |
| (defect fix, no FR) | FINDING-IS-003 |
| (design constraint, no FR) | FINDING-IS-006 |
