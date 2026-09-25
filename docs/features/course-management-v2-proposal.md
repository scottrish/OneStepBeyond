# Feature: Course Management — Color Selection, Deletion & Courses-First Onboarding (v2 proposal)

**Status:** §1 and §2 approved 2026-09-25 by the product owner (see the
"Decision" notes in each). §3 was never contested. Not yet built
(roadmap Phase 7 step 3). Produced from a prototype-sync
audit of `../OneStepBeyondPrototype` (baseline commit `834368f`; `main`
HEAD `744026a`; re-synced 2026-09-24 against the unmerged
`mobile-redesign` branch at `1ce3145`, which changes how delete is
triggered (§2), enlarges the color swatches (§1), and adds a
"courses first" gate on Home (§3)). `src/routes/courses.tsx` is an entirely new
prototype screen (202 lines) built after `course-setup.md` was written —
that spec explicitly said no prototype screen existed to match against
at the time.

**How to read this document:** UX/behavior/copy evidence only, per
`daily-planning-and-completion-v2-proposal.md`'s note on the prototype's
status as a localStorage-backed mock, not code to port.

## Summary

`course-setup.md` made two explicit, resolved product decisions on
2026-08-14: auto-assigned non-editable course color, and course deletion
deferred entirely until "a real design question exists to answer." The
prototype has since built a full answer to both — this document proposes
reopening those two decisions with the prototype's specific answer on
the table, not re-deciding from a blank page. §3 adds one small,
genuinely new behavior: Home's first-run state for a student with no
courses.

## Source

Prototype: `src/routes/courses.tsx`, `src/lib/domain/courses.ts` (new,
17 lines), `src/lib/domain/store.tsx`'s `addCourse`/`updateCourse`/
`deleteCourse`.

## Current production behavior (for contrast)

`src/pages/CoursesPage.tsx`: create (name only) and rename only, list
with a fixed non-editable dot color (`courseColorValue(course.colorIndex)`).
No delete action anywhere in the file.

## 1. Manual color selection — reopening a resolved decision

**Original decision (`course-setup.md`, 2026-08-14):** "Auto-assigned,
non-editable color — confirmed. Simpler and consistent with the
product's cognitive-load principles; manual color-coding can be
revisited later if students ask for it."

**What the prototype now does:** at both creation and edit time, a
student picks from a fixed 8-swatch palette (`COURSE_ACCENTS` — Clay,
Fern, Amber, Violet, Slate blue, Teal, Rose, Moss; the same design
tokens this app already uses for course colors, not new colors). A new
course defaults to the first swatch not already in use by an existing
course (cycling once all 8 are taken), so back-to-back additions don't
default to the same color — the auto-assignment behavior production
already has isn't discarded, it just becomes the *default* rather than
the *only* option.

**Proposed decision:** adopt manual selection, keeping auto-assignment
as the default so a student who doesn't care never has to make this
choice — this doesn't actually reverse the cognitive-load reasoning
behind the original decision (nothing is *required*), it only removes
the "non-editable" half. Recommend product sign-off given this
explicitly reopens a named, dated decision rather than filling an
unaddressed gap.

**Decision (2026-09-25): approved as proposed.** Manual colour choice,
with the next unused colour pre-selected as the default. Supersedes
`course-setup.md` resolution 1.

**Functional Requirements:**
- Add form: name field (unchanged) plus a color-swatch picker, defaulted
  to the next unused accent.
- Existing courses gain an edit affordance for both name and color
  together (today only name is editable).
- The 8-swatch palette is this app's existing course-accent tokens —
  no new colors introduced.
- Each swatch is a 44×44 px button (`size-11` on `mobile-redesign`; 28 px
  on `main`). Its accessible name is the swatch's label ("Clay",
  "Fern", …), and `aria-pressed` marks the selected one. Selection is
  shown by a ring *and* a check mark, not by color alone.

**Acceptance Criteria:**
- Adding a course lets the student pick a color, pre-selected to an
  accent not already used by an existing course when one is available.
- Editing an existing course can change its name, its color, or both.
- A course's color, once set, persists and is used everywhere that
  course's color already renders today (dots, accents).

## 2. Course deletion, with cascade

**Original decision (`course-setup.md`, 2026-08-14):** deletion deferred
entirely, "becomes its own future increment once real usage informs the
right behavior, instead of being speculatively designed now."

**What the prototype now does:** on `main`, a trash icon per course row
toggled an inline (not modal) confirmation. On `mobile-redesign` the
trash icon is gone. Delete is now **revealed by swiping the row left**
on touch, or chosen from a **"More actions for {name}" overflow menu**
at `sm:` and up. Either way it opens the **same inline confirmation**;
neither deletes immediately. The swipe/overflow pattern is shared by
every removable list and is specified once in
`mobile-gestures-reorder-and-swipe-v0.1.md`. This section covers only
what's specific to courses. Confirmation copy depends on whether the
course has any assignments:

- Zero assignments: "Delete {name}?"
- One or more: "Deleting {name} also deletes its {N} assignment(s) and
  any planned work. This cannot be undone." (correct singular/plural)

Buttons: destructive "Delete" and ghost "Keep it" (not "Cancel"). On
confirm, the course, its assignments, their Work Items, Work Sessions,
Reflections, Assignment Briefs, and Decomposition Episodes are all
removed — a full cascading hard delete, no orphaned rows.

**Proposed decision:** adopt a cascading hard delete with this exact
conditional-warning pattern — it directly answers the "real design
question" the original deferral was waiting for: an in-use course is
deleted along with everything under it, made unmistakable by the warning
copy, rather than blocked or silently orphaning data.

**Decision (2026-09-25): approved, with a stronger warning.** Cascading
hard delete as proposed, and supersedes `course-setup.md` resolution 2.
When a course has assignments, the warning must say plainly that
**every** assignment is deleted, whatever its state (not yet planned,
planned, or completed), and not just "any planned work". It replaces the
prototype's in-use copy above:

> **Delete {name} and all its assignments?**
> This also deletes its {N} assignment(s): ones you haven't planned yet,
> ones you've planned, and ones you've completed. Their steps, planned
> time and reflections go too. This can't be undone.

The course name and the count are in the text, with correct singular and
plural. The warning is styled as a destructive alert, not muted helper
text. Buttons stay destructive **Delete** and ghost **Keep it**. A
course with no assignments keeps the plain "Delete {name}?" prompt.

**Functional Requirements:**
- Delete affordance per course row, using the shared swipe-to-reveal /
  overflow-menu pattern (`mobile-gestures-reorder-and-swipe-v0.1.md`).
  Revealing Delete and tapping it opens the inline confirmation; it
  never deletes directly. Empty-course and in-use-course cases get
  different confirmation copy, matching the pattern above.
- The edit (pencil) button stays visible on the row at 44×44 px. Edit is
  not moved into the swipe action or the overflow menu.
- Confirming deletes the course and cascades through assignments → work
  items → work sessions/reflections/briefs/decomposition records for
  those assignments, mirroring this app's own existing cascade-delete
  pattern for whole-assignment deletion (`AssignmentDetailPage.tsx`'s
  existing `hasCompletedSteps` confirmation is the closest existing
  precedent for "warn harder when real work would be lost").
- No separate "in-use protection" block — this app already accepts that
  deleting an assignment removes its own dependents; a course delete is
  the same idea one level up.

**Acceptance Criteria:**
- Deleting a course with no assignments asks a plain confirmation and,
  once confirmed, removes only that course.
- Deleting a course with assignments shows the decided warning above:
  the assignment count (correct singular/plural), and that not-yet-planned,
  planned and completed assignments are all deleted. Once confirmed, it
  removes the
  course and every assignment (and everything under those assignments)
  that referenced it.
- Cancelling ("Keep it") leaves the course and everything under it
  unchanged.
- Delete can be reached without a swipe gesture: through the overflow
  menu at `sm:` and up, and by keyboard focus on every breakpoint.

## 3. "Add your courses first" on Home for a student with no courses

**New, from `mobile-redesign` (commit `3193f61`, "Added fresh reset &
home flow").** Today a brand-new student lands on a normal Home with
nothing on it. They only find out courses are needed when they try to
add an assignment and `AssignmentCapturePage`'s own "no courses" branch
stops them. The prototype now checks this up front. When the student
has **zero courses**, Home replaces its whole body with a single
onboarding state:

> *Getting started*
> **Welcome, {first name}.**
>
> **First, add your courses.**
> Every assignment belongs to a class, so start by adding the classes you
> take this term.
> [Add your courses]

"Add your courses" opens Courses. When the student comes back to Home
with at least one course, Home renders normally. The tab bar stays
visible and usable throughout. This gate is a Home state only. It
doesn't block navigation.

**Relationship to existing specs:** this is additive to
`course-setup.md`, which defines Courses itself, and to
`assignment-capture.md`, whose no-courses guard stays as a second line
of defense (e.g. if the student deletes their last course and goes
straight to capture). It doesn't change `home-dashboard.md` for any
student who has at least one course.

**First name:** the prototype uses a stored `studentName`. This app has
no profile name and derives one from the email (`displayNameFromEmail`
in `HomePage.tsx`). Use that same derivation. Don't add a name field
for this.

**Acceptance Criteria:**
- A signed-in student with zero courses sees the "First, add your
  courses." state on Home instead of the Next card, Needs Attention,
  Activities, or Coming Up.
- "Add your courses" opens Courses. After adding at least one course and
  returning, Home renders its normal content.
- Deleting the last course (§2) returns Home to this state.
- The state loads with the same loading/error handling as Home's other
  data (`useAsyncData` + `ErrorBanner`). A course-load error shows the
  error banner, not the onboarding state.

## Domain Model Touchpoints

- Course gains a student-editable `accent`/color field (already exists
  as a column; only its editability changes).
- Course deletion is a new cascading operation touching Assignment, Work
  Item, Work Session, Reflection, Assignment Brief, and Decomposition
  Attempt — no new tables, no schema change.

## Explicitly Out of Scope (this proposal)

- Course reordering — the prototype has none either; list order is
  insertion order in both.
- Archiving a course at end of term, as opposed to deleting it — not
  addressed by the prototype, still a genuinely separate question.
- Terms, grading periods, or teacher/period metadata — unchanged from
  `course-setup.md`'s existing exclusions.
- The prototype Settings screen's dev-only "Clear all data" / "Reset
  with example data" / "Start completely fresh" testing affordances
  (the last one added on `mobile-redesign` to exercise §3's first-run
  state), reached from the same navigational area as this feature.
  These are QA/demo tooling for a localStorage-backed prototype, not a
  production feature, and are explicitly not proposed here. In this
  app, a fresh account already reaches §3's state.
