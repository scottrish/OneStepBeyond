# Feature: Activities

**Status:** Implemented (2026-08-15). List, add, in-place day-toggle, and
delete are built and tested. Two things this spec describes aren't yet
true, both because of what they depend on rather than a gap in this
feature itself: the "immediately changes... computed study capacity in
both Planning and Week Look-Ahead" acceptance criterion isn't verifiable
until `daily-planning.md`/`week-lookahead.md` exist (Phase 4), and only
the day selection is directly editable in place — changing an existing
activity's name, times, or travel minutes currently requires delete and
re-add, since the spec's own UX Flow only calls out day-editing as
in-place. See `docs/Roadmap.md` Phase 1.

**Amendment implemented (2026-08-17):** the single `travelMinutes` field
described in the sections below has been replaced with independent
`travelToMinutes`/`travelFromMinutes` — see the Amendment section near
the end of this document, now the accurate description of current
behavior. References to "travel minutes"/"travel time each way" earlier
in this file describe the pre-amendment shape only.

## Summary

Let a student record recurring non-academic commitments (sports, jobs,
clubs, lessons) so that Planning and Week Look-Ahead reflect real available
time instead of pretending every unscheduled hour is study time.

## Source

Prototype: `src/routes/activities.tsx`.

## User Story

As a student with football five afternoons a week, I want the app to
already know practice is happening so it doesn't suggest I do two hours of
homework at 4pm.

## UX Flow

- Reached via a settings/gear icon in Home's header (not primary bottom
  navigation — this is setup, not a daily destination).
- List of existing activities, each showing name, days (abbreviated,
  Sun–Sat), start–finish time, and travel time if any; a trash action to
  remove.
- Each activity's day selection is directly editable in place (tap a day
  chip to toggle it) without opening a separate edit form.
- Add form: name (free text), days (multi-select day chips, defaults to
  Mon–Fri), start/finish (time pickers), travel time each way in minutes
  (numeric, used to pad both sides of the commitment).
- Empty state: "No activities yet." / "Add practice, work or anything else
  that takes up your afternoons."

## Functional Requirements

- An activity is valid to save when it has a non-empty name, at least one
  selected day, and a finish time after its start time.
- Travel time is applied symmetrically (before start and after finish)
  wherever an activity blocks capacity, not just modeled as a single trip.
- Activities feed directly into `availableMinutes` (Planning) and the Week
  Look-Ahead's per-day capacity and "commitments today" lists — there is
  exactly one source of truth for a day's busy time.

## Acceptance Criteria

- Adding an activity immediately changes that day's computed study
  capacity in both Planning and Week Look-Ahead.
- A day/time toggle can be changed after creation without deleting and
  re-adding the activity.

## Domain Model Touchpoints

- Commitments → Activity ("scheduled non-academic commitment"); Planning →
  Availability ("realistic time in which academic work could reasonably
  occur... may account for... activities... travel").

## Explicitly Out of Scope (this increment)

- One-off (non-recurring) activities or exceptions to a recurring
  schedule (e.g. "no practice this Friday").
- Activity categories/icons.

No deviations from the prototype are proposed for this feature's
originally-shipped scope. See the Amendment below for a change proposed
after shipping.

## Amendment: split travel time into "travel to" and "travel from"

Raised 2026-08-17. A single `travelMinutes` value, applied symmetrically
before start and after finish, is wrong for a real, common case: an
activity that starts immediately after school *at school* (marching
band rehearsal in the same building, for instance) has no meaningful
travel-to time, but still has a real travel-from time getting home
afterward — and the reverse is just as real (a ride that arrives home
right at pickup time with no lingering, but a real drive-there beforehand).
A single symmetric value can't represent either case correctly.

### Decision

Replace `travelMinutes` with two independent, each-defaulting-to-0
fields:

- **`travelToMinutes`** — padding applied before `startTime`.
- **`travelFromMinutes`** — padding applied after `finishTime`.

### Functional Requirements (supersedes the original "applied
symmetrically" line above)

- `travelToMinutes` blocks capacity only before the activity's start;
  `travelFromMinutes` only after its finish. Either may be zero
  independently — that's the entire point of this amendment, not an
  edge case to special-case away.
- `src/domain/studyCapacity.ts` updates both call sites that currently
  read the single `travelMinutes` value: `availableMinutes`'s busy-time
  sum (currently adds `travelMinutes` once per activity — worth fixing
  to add `travelToMinutes + travelFromMinutes` explicitly while this
  lands, since the single-value version was already under-counting
  relative to `studySlots`' own symmetric window-carving) and
  `studySlots`'s window boundaries (`start - travelToMinutes`,
  `finish + travelFromMinutes`, replacing the single-value subtract/add
  pair).
- Migration: `activities.travel_minutes` → `travel_to_minutes` +
  `travel_from_minutes` (both `integer not null default 0 check (>= 0)`,
  same shape as today's single column). Existing rows: split the
  existing single value however preserves current behavior most
  faithfully — recommend copying the existing value into *both* new
  columns on migrate (preserves today's symmetric behavior for every
  activity that hasn't been touched yet, rather than guessing which
  side a given activity's travel time was ever meant to represent).

### UX Flow (supersedes "travel time each way in minutes (numeric)")

- Add/edit form: two numeric fields, "Travel there" and "Travel back,"
  each independently optional (defaulting to 0), instead of one
  "travel time each way" field.
- List display: show whichever of the two is non-zero (e.g. "+15m there"
  / "+10m back" / "+15m there · +10m back"), omitting a zero side
  entirely rather than showing "+0m."

### Acceptance Criteria (additive)

- An activity with `travelToMinutes = 0` and `travelFromMinutes > 0`
  blocks no capacity before its start time, and the correct amount
  after its finish time — and vice versa.
- Existing activities created before this amendment ships continue to
  block the same total capacity they did before (both new fields
  populated from the one old value on migration).
