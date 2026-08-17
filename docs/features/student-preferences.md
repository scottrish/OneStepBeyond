# Feature: Student Preferences (Study Hours)

## Summary

Lets a student configure the realistic study window Daily Planning builds
every capacity calculation from — currently a single fixed pair of
constants (`WEEKDAY_WINDOW`, `WEEKEND_WINDOW` in
`src/domain/studyCapacity.ts`, identical for every student) — so that "how
much time do I actually have" reflects this student's own schedule rather
than an assumed one. Realizes Domain-Model.md's already-defined
`Preferences` entity (Student context) and `Availability`'s "configured
study limits" input, neither of which have been built yet.

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

## UX Flow

- Reached via the same Settings list `home-dashboard.md` already
  specifies behind Home's header gear icon (currently Activities,
  Courses, Sign Out) — add a fourth entry, **"Study Hours."** This is a
  cross-cutting touchpoint on that spec, not just this one; update its
  Settings list accordingly when this ships.
- A single form, no wizard:
  - **Weekday** — finish time (when the student is realistically done
    studying on a school night). Replaces `WEEKDAY_WINDOW.finish`
    ("21:00" today).
  - **Weekend** — same shape as weekday (a start time and a finish time,
    from which total available hours is derived), kept as its own,
    independently set pair rather than a bare hours count — see Open
    Questions for why "how many hours" needs one clarification before
    this is final. Replaces `WEEKEND_WINDOW` ("10:00"–"20:00" today).
- Defaults to today's hardcoded constants for a student who hasn't
  configured anything yet, so nothing regresses for an existing account
  the moment this ships.
- Changes take effect immediately — the same "one source of truth, no
  separate confirm step" precedent `activities.md` already established
  for its own capacity-affecting settings.

## Functional Requirements

- `src/domain/studyCapacity.ts`'s `windowFor(dateISO)` reads these
  per-student values instead of the fixed `WEEKDAY_WINDOW`/
  `WEEKEND_WINDOW` constants — every consumer (`availableMinutes`,
  `studySlots`, and Risk Detection's own capacity-through-due-date sum)
  updates automatically since they already go through `windowFor`
  indirectly via those two functions.
- A change to these preferences immediately changes computed capacity
  everywhere it's used (Daily Planning, Week Look-Ahead once built, Risk
  Detection) — same immediacy guarantee `activities.md` already commits
  to for its own settings.
- Validation: weekday and weekend finish times must be after their
  respective start times (weekday start is addressed in Open Questions
  below); this mirrors the existing Activity validation rule
  (`finish_time > start_time`) exactly.

## Acceptance Criteria

- Changing the weekday finish time immediately changes "That leaves
  about {X} of study time" on Daily Planning's Day step for a weekday
  being planned.
- Changing weekend hours immediately changes the same figure for a
  Saturday/Sunday being planned, independently of any weekday change.
- A student who has never opened this screen sees exactly the same
  capacity numbers as before this feature existed (default = today's
  hardcoded constants).

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

## Open Questions

- **Is weekday *start* time also meant to be configurable, or only the
  finish time?** The request specifically named "when does the student
  finish for the night" — this spec keeps weekday start fixed at the
  current default (15:15, "after school") on that basis, but a school
  day's actual end time varies by student just as much as bedtime does.
  Worth confirming before implementation rather than assuming either
  way.
- **Is weekend availability really a raw hours *count*, or a time
  *window* (start + finish) like weekday?** "How many hours at the
  weekend" reads like a single number, but `studySlots` needs an actual
  time-of-day window to suggest concrete slots against, not just a
  duration. This spec's UX Flow above defaults to a start+finish window
  (matching weekday's shape, with total hours as a derived, displayed
  figure) as the more directly implementable reading — confirm before
  building, since a pure-hours-budget model would need a different
  slot-suggestion approach.
- Should weekday and weekend both get independent *start* times, or does
  only weekend need one (since weekday's start is arguably anchored to
  "school ends")? Follows from the first question above.

No deviations from the prototype are proposed for this feature (no
prototype screen exists to deviate from).
