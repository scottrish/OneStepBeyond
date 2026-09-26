# Execution coaching, part one: timing, revised estimates, and completion checks

Date: 2026-09-25

## Context

`execution-coaching-v0.1.md` (roadmap Phase 7 step 12) adds four things
to Today Execution: a "What's getting in the way?" coaching pipeline;
two completion-time checks; silently recorded elapsed time; and a
revised estimate shown honestly. The product owner settled five
questions on 2026-09-25 (E1–E5) and approved building it in two parts.
This record covers the whole step's decisions, and what part one (12a)
built.

## Decision

1. **E5 — two increments.**
   - **12a (this one):** session timing, revised estimates, the two
     completion checks and the turned-in reminder.
   - **12b:** the coaching table, friction picker, interventions,
     own-first-action and reschedule sheets.
   - Each has its own migration, tag and migration review.
2. **E1 — how a revised estimate is stored.** `planned_minutes` stays the
   working estimate every reader already uses: capacity, re-chaining,
   Plan, Home, Look Ahead and risk detection. A new nullable
   `original_planned_minutes` keeps what it was before the *first*
   revision; later revisions don't change it. The student sees "about
   40m · first planned 30m" (`estimateLabel`). The spec's shape (an
   immutable `plannedMinutes` plus a new current estimate) would have
   made every reader switch to `current ?? planned`, for the same
   information. Moving a session to another day carries the original
   along; the migration reviewer caught that the copy dropped it.
3. **Elapsed time** is recorded silently. `started_at` is set on Start
   (Today's, and Home's Next card's), and `completed_at` on Done, both
   from the device's clock. Elapsed time is `completed_at − started_at`,
   and "unknown" when either is missing. Nothing shows a timer or asks
   for minutes. Nothing reads it yet: the coach dashboard and risk
   detection will, in their own specs.
4. **Completion checks**, full-screen steps rather than sheets:
   - **"Is the whole task done?"** is asked only when the step has other
     not-done sessions. **Yes** completes the step and deletes that
     other time. **Not yet** completes the session but leaves the step
     open, which is new: until now, finishing a session always finished
     its step.
   - **"Is the whole assignment done?"** is asked only when that was the
     assignment's last open step (`isAssignmentFinishable`).
5. **E3 — screens after the assignment is completed.** The breakdown
   reflection (it always had steps), then the turned-in reminder, and
   **not** also the session question ("Did this take longer than you
   expected?"). One reflection is enough. Otherwise the session question
   works as before.
6. **For 12b, already settled:**
   - **E2:** the reschedule sheet's "Later today" uses the next free
     slot after today's plan, avoiding activities (the scheduler), not
     the prototype's fixed 19:30, and is hidden if nothing fits.
     "Tomorrow" moves the session without a time.
   - **E4:** the old "Move to tomorrow" (defer, which deleted the
     session) is retired once "I'm stuck" opens the friction picker. The
     reschedule sheet's "Tomorrow" replaces it. That corrects the spec's
     "defer stays" line.
   - Until 12b ships, "I'm stuck" and "Move to tomorrow" work as before.

## Alternatives considered

- **The spec's storage shape** (see E1).
- **Storing an `actual_minutes` value and a source tag** instead of
  timestamps. It would be derived data that can drift; the two
  timestamps hold strictly more.
- **Asking all four screens** after an assignment is completed
  (reflection, reminder, then the session question). Too much at the
  end of a long task.

## Consequences

- The device's clock can be wrong, and a session left open overnight
  gives a huge elapsed time. Anything that reads elapsed time should
  treat outliers with care.
- After "Not yet — keep the rest of the plan", Plan keeps offering that
  step, which is correct: it isn't finished.
- `updateWorkSessionStatus` and `updateWorkSessionPlannedMinutes` are
  replaced by `startWorkSession`, `completeWorkSession` and
  `reviseWorkSessionEstimate`.
- **Part 12b built** as settled above (E2, E4). Its migration's insert
  and update policies also check that the step and session belong to the
  student; the migration reviewer caught that, and it was fixed before
  commit.
- **A race found in the real-browser check, now fixed.** Home's "Start"
  used to save without waiting before opening Today, so Today could load
  the session as still "planned" and ask to Start it again, overwriting
  `started_at`. Home now waits for the save (and still opens Today if the
  save fails). This predates 12a, but recording `started_at` made it
  matter.
