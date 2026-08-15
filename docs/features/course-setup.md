# Feature: Course Setup

**Status:** Implemented (2026-08-15). Create, rename, and list are built
and tested, matching this spec exactly — deletion remains deferred, as
specified. See `docs/Roadmap.md` Phase 1.

## Summary

Let a student maintain their own list of courses, so Assignment Capture has
something real to attach to instead of a hardcoded list. Small and
foundational: [assignment-capture.md](assignment-capture.md) depends on it.

## Source

None. The prototype ships with five hardcoded demo courses (English,
Biology, World History, Spanish, Algebra II) and has **no course
management UI at all** — fine for a single fixed demo student, not for real
students who each take different classes. This spec is new, modeled on
[activities.md](activities.md)'s list-plus-form pattern, written to resolve
the open question raised in `assignment-capture.md`. Everything in it is a
proposed design, not a ported one — see the deviation note at the bottom.

## User Story

As a student, I want to set up my own classes once, so every assignment I
capture afterward just works.

## UX Flow

- Reached via the same small settings surface as
  [activities.md](activities.md), behind Home's header gear icon.
- List of existing courses: a color swatch and the course name. Tapping a
  course's name lets the student rename it in place. No delete action this
  increment (see Functional Requirements).
- Add form: a single field, "What's it called?" (e.g. "Biology"). No color
  picker — color is assigned automatically (see below).
- Empty state: "No courses yet." / "Add your first class so you can start
  capturing assignments." — with the add form immediately available, not
  hidden behind another tap, since this is the very first thing a new
  student needs to do.

## Functional Requirements

- A course is valid to save once its name is non-empty. No other fields
  are required.
- Color is auto-assigned at creation time from a fixed, rotating accent
  palette (the same tokens the prototype uses for course dots/accents),
  cycling once the palette is exhausted. The student cannot choose or
  change a course's color in this increment — one fewer decision, per
  Design-Principles.md's Fourth Principle ("Reduce Cognitive Load").
- Renaming a course changes only its display name. Assignments reference a
  course by id, so existing assignments are unaffected.
- **Course deletion is deferred — not built this increment.** A student
  who no longer wants a course lives with it in the list; it is never
  silently hidden or auto-archived. Deletion (and whatever in-use
  protection it needs) is picked up as its own future increment once a
  real design question exists to answer, rather than speculatively built
  now — see Backlog in `docs/Roadmap.md`.
- New students start with zero courses. The prototype's seeded course list
  was demo data for one fictional student and should not be replicated for
  real accounts.

## Acceptance Criteria

- A student can create a usable course with just a name, in a few seconds.
- Assignment Capture's course picker always reflects the student's real,
  current course list — no course is ever hardcoded.
- No UI affordance for deleting a course exists this increment.

## Domain Model Touchpoints

- Student → Courses (Domain-Model.md: the Student context "Owns: Profile,
  Preferences, Courses, Availability, Support relationships").
- Commitments → Assignment.courseId reference.

## Explicitly Out of Scope (this increment)

- Manual color selection or customization.
- Deleting a course, in-use or not (see Functional Requirements) — and by
  extension, archiving a course at the end of a term/year.
- Terms, grading periods, or teacher/period metadata.

## Deviation from the prototype — resolved

Unlike every other spec so far, this feature has no prototype screen to
match against — the whole UX flow above is proposed, not ported. Two open
questions were resolved by product decision (2026-08-14):

1. **Auto-assigned, non-editable color** — confirmed. Simpler and
   consistent with the product's cognitive-load principles; manual
   color-coding can be revisited later if students ask for it.
2. **Course deletion deferred entirely**, rather than shipping either a
   hard block or a cascading/unlinking delete this increment. Narrows this
   feature to create/rename/list only; deletion (and its in-use-protection
   design) becomes its own future increment once real usage informs the
   right behavior, instead of being speculatively designed now.
