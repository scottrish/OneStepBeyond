# Separate Saturday and Sunday study hours, and no protected buffer

Date: 2026-09-25

## Context

`student-preferences.md` (2026-08-17) gave students one weekend-hours
budget for any Saturday or Sunday, and subtracted a fixed
`PROTECTED_MINUTES` (90) from every day's capacity. The prototype now has
separate Saturday and Sunday budgets set with steppers, and its capacity
formula has no protected buffer on any day.
`study-hours-v2-proposal.md` (roadmap Phase 7 step 4) proposes the split
and asked for the buffer question to be settled explicitly. The product
owner settled that and five build questions on 2026-09-25.

## Decision

1. **Retire `PROTECTED_MINUTES` (§3, option b)** on every day, weekdays
   included. A day's capacity is its weekday window (15:15 to the "done
   by" time) or its own weekend budget, minus activities with travel,
   minus work already planned. The student's own settings are the
   protection. Design-Principles.md's "Protect What Matters" names no
   buffer, so it doesn't change.
2. **Separate budgets.** `student_preferences.weekend_hours` is replaced
   by `saturday_hours` and `sunday_hours` (0–8, half-hour steps, set with
   steppers). Saturday's capacity uses only Saturday's budget, Sunday's
   only Sunday's.
3. **S1 — every change saves straight away**; the Save button is gone.
   The proposal claimed this screen already had no Save step; it did, so
   this is a change, not parity by default. Saves go one at a time and
   only the newest waiting change is sent, so quick taps can't be
   overwritten by a slow reply. A failed save keeps the change on screen
   with an error and a Try again button.
4. **S2 — defaults: 2 hours each on Saturday and Sunday** for a student
   who has never saved study hours (`DEFAULT_PREFERENCES` and the column
   defaults). The prototype uses 2 and 3; this app deliberately gives
   both days the same default.
5. **S3 — existing saved values** are copied to both days in the
   migration, capped at 8 and rounded to the nearest half hour. The old
   default of 10, saved by anyone who pressed Save without changing it,
   becomes 8. This is done once in the database, not converted on every
   read as the proposal suggested, so no old column lingers.
6. **S4 — weekends still get no suggested time chips**
   (`student-preferences.md`'s existing decision). The prototype's fixed
   10:00–20:00 weekend chips don't match its own budgets.
7. **S5 — `weekdayFinishTime` keeps its name** (not `weekdayDoneBy`).

## Alternatives considered

- **Keep the 90-minute buffer (option a).** With per-day weekend budgets
  it swallows small ones: any budget of 1.5 h or less would show no
  study time at all.
- **Keep the Save button**, with steppers that save only on Save. Fewer
  writes, but it disagrees with the prototype and the proposal's
  acceptance criterion.
- **Convert the old value when reading it** (the proposal's "read-time
  migration"). It would keep `weekend_hours` around indefinitely, with
  two sources of truth.

## Consequences

- **Capacity numbers change everywhere** (Plan, Look Ahead, Home, risk
  detection). A default weekday rises from 255 to 345 minutes before
  activities (Look Ahead's phrase moves from "Mostly open" to "Plenty of
  room"). An unconfigured weekend day falls from 510 minutes (10 h minus
  the buffer) to 120. Risk detection's "not enough time" flag fires less
  often for weekday-only stretches and more often across weekends.
- The migration drops `weekend_hours`. That's fine here: there's one
  client, deployed together, and the project uses local Supabase only
  (`20260814-local-supabase-for-initial-development.md`).
- Step 10's weekend re-chaining (a 16:00 start with activities as
  obstacles) is unchanged, since weekends still have no time windows.
