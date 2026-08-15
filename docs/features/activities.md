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

No deviations from the prototype are proposed for this feature.
