# Feature: Student Preferences (Study Hours)

**Status:** Implemented (2026-08-17). New "Study hours" entry in Settings
(behind Home's header gear icon, alongside Activities/Courses); weekday
finish time and weekend hours budget both save immediately, no separate
confirm step. `studyCapacity.ts`'s `availableMinutes`/`studySlots` and
Risk Detection's capacity-through-due-date sum all read live preferences
now instead of the old fixed `WEEKDAY_WINDOW`/`WEEKEND_WINDOW` constants
(removed). A student who has never opened the screen sees unchanged
capacity numbers — `student_preferences` defaults match the old
constants exactly when no row exists yet.

## Summary

Lets a student configure the realistic study time Daily Planning builds
every capacity calculation from — currently a single fixed pair of
constants (`WEEKDAY_WINDOW`, `WEEKEND_WINDOW` in
`src/domain/studyCapacity.ts`, identical for every student) — so that "how
much time do I actually have" reflects this student's own schedule rather
than an assumed one. Weekday is a **finish time** (start stays fixed);
weekend is an **hours budget**, not a time window — see Design Decisions
below for why the two are deliberately shaped differently. Realizes
Domain-Model.md's already-defined `Preferences` entity (Student context)
and `Availability`'s "configured study limits" input, neither of which
have been built yet.

## Source

No prototype route — the prototype hardcodes the same fixed windows this
feature replaces. Per CLAUDE.md's Visual & Aesthetic Reference guidance,
this screen's UI should still adopt the prototype's overall look
(component style, spacing scale, color tokens) rather than inventing a
new aesthetic, the same way `course-setup.md` did with no prototype
screen of its own.

## User Story

As a student, I want the app's sense of "how much study time I have
today" to match my actual schedule — when I'm realistically done for the
night on a school day, and how much of a weekend day I'm willing to give
to schoolwork — instead of a guess that's wrong for everyone by
definition.

## Design Principle: weekends are not a special case

Weekday and weekend study time are both first-class, independently
configured values — never one derived from the other, and never
defaulted toward zero. Daily Planning's day-picker already treats a
Saturday or Sunday exactly like any weekday as a plannable day (see
`daily-planning.md`'s 5-day Today+4 strip, which has no weekend
exclusion); this feature must preserve that. A student who studies more
on weekends than on a school night is a normal case, not an edge case.
Being shaped differently (finish time vs. hours budget — see Design
Decisions) is not a lesser treatment; it's the more honest model for
each.

## Design Decisions (resolved 2026-08-17)

- **Weekday start time stays fixed**, not configurable — students aren't
  expected to use pre-school time for work, so there's nothing real to
  configure there. Only the weekday *finish* time is a preference.
- **Weekend is an hours budget, not a time window.** Students won't
  realistically hold to a fixed weekend time slot the way a school day's
  "after school" anchor holds. Concretely, this means weekend has no
  start/finish time at all — just a single "hours available" number.
- **The weekend budget is subtracted from the same way a weekday window
  is** — Activities/travel and the fixed `PROTECTED_MINUTES` block still
  come out of it, exactly like weekday's window span. It is not treated
  as already-net free time. This keeps the weekday and weekend formulas
  the same shape, just with the budget standing in for "window span" as
  the starting total.
- **`studySlots` (the Schedule step's suggested time chips) returns no
  suggestions for a weekend date**, since a budget alone has no clock-time
  anchor to carve stretches from — inventing one (e.g. "always start at
  9am") would just be re-introducing the fixed slot this decision
  explicitly rejected. This isn't a gap: the Schedule step already always
  renders a manual time input alongside any suggested chips regardless of
  whether chips exist, so a weekend item falls back to "type whatever
  time makes sense" with no new UI required — it already works this way
  for any day with zero open stretches.

## UX Flow

- Reached via the same Settings list `home-dashboard.md` already
  specifies behind Home's header gear icon (currently Activities,
  Courses, Sign Out) — add a fourth entry, **"Study Hours."** This is a
  cross-cutting touchpoint on that spec, not just this one; update its
  Settings list accordingly when this ships.
- A single form, no wizard:
  - **Weekday** — finish time only (when the student is realistically
    done studying on a school night). Replaces `WEEKDAY_WINDOW.finish`
    ("21:00" today); start stays fixed at the current default (15:15).
  - **Weekend** — a single "hours available" number, not a time window.
    Replaces `WEEKEND_WINDOW` ("10:00"–"20:00" today, a 10-hour span) —
    default this to the equivalent 10 hours so an unconfigured account's
    capacity numbers don't change.
- Defaults to today's hardcoded constants (as hours, for weekend) for a
  student who hasn't configured anything yet, so nothing regresses for
  an existing account the moment this ships.
- Changes take effect immediately — the same "one source of truth, no
  separate confirm step" precedent `activities.md` already established
  for its own capacity-affecting settings.

## Functional Requirements

- `src/domain/studyCapacity.ts`'s `windowFor(dateISO)` (used by
  `availableMinutes`) reads the student's weekday finish time and
  weekend hours budget instead of the fixed `WEEKDAY_WINDOW`/
  `WEEKEND_WINDOW` constants. `studySlots` needs its own explicit update
  too — it currently duplicates `windowFor`'s weekday/weekend check
  inline rather than sharing it, and per the Design Decisions above must
  return `[]` for a weekend date rather than trying to derive a window
  from the budget.
- Risk Detection's capacity-through-due-date sum
  (`src/domain/riskDetection.ts`) and `PlanPage.tsx`'s three call sites
  (Day-step capacity, Schedule-step slots, Move's target-day capacity
  check) all pick up the change automatically once `availableMinutes`/
  `studySlots` do, with no call-site-specific logic of their own.
- A change to these preferences immediately changes computed capacity
  everywhere it's used (Daily Planning, Week Look-Ahead once built, Risk
  Detection) — same immediacy guarantee `activities.md` already commits
  to for its own settings.
- Validation: weekday finish time must be after the fixed start time
  (15:15); weekend hours must be a positive number. This mirrors the
  existing Activity validation rule's spirit (`finish_time > start_time`)
  without a literal analog for weekend, since it no longer has two times
  to compare.

## Acceptance Criteria

- Changing the weekday finish time immediately changes "That leaves
  about {X} of study time" on Daily Planning's Select step (Day, before
  `docs/decisions/20260818-plan-day-step-removed.md`) for a weekday
  being planned.
- Changing weekend hours immediately changes the same figure for a
  Saturday/Sunday being planned, independently of any weekday change.
- A weekend day's Schedule step shows no suggested time chips, only the
  manual time input — never a fabricated slot with no real basis.
- A student who has never opened this screen sees exactly the same
  capacity numbers as before this feature existed (default = today's
  hardcoded constants, weekend expressed as the equivalent 10-hour
  budget).

## Domain Model Touchpoints

- Student → **Preferences** (already listed as owned by the Student
  context in Domain-Model.md, not yet built until now).
- Planning → **Availability** — "configured study limits" is one of
  Availability's own listed inputs; this feature is that input's first
  real implementation.

## Explicitly Out of Scope (this increment)

- The fixed protected/downtime block (`PROTECTED_MINUTES`, currently a
  flat 90-minute constant subtracted after the window and Activities) —
  not raised in this request; stays a fixed constant unless a future
  increment asks for it to be configurable too.
- Per-day-of-week granularity beyond the weekday/weekend split (e.g. a
  different Friday-night window than Monday) — the current domain model
  and `studyCapacity.ts` only distinguish weekday vs. weekend at all;
  going finer is a bigger change than this request asked for.
- Any coach/parent visibility into or override of a student's own
  preferences (deferred, see
  `docs/decisions/20260813-student-only-first-increment.md`).

No deviations from the prototype are proposed for this feature (no
prototype screen exists to deviate from).
