# Feature: Today's Work & Reflection

## Summary

Support execution of the day's confirmed plan, one task at a time, and
close the loop with a single short reflection question after each
completed session. This is where Planning ("intention") meets Execution
("behaviour") in the Domain Model's learning loop.

## Source

Prototype: `src/routes/today.tsx`.

## User Story

As a student, I want to know exactly what I'm doing right now without
looking at the whole day, and to be able to say "I need more time" or "I'm
stuck" without it feeling like failure.

## UX Flow

- Reached from Home's "Next" card or Plan's confirmation step.
- Shows exactly **one** current task at a time — the first not-done
  session for today — with its title, course, and planned duration. Later
  items are visible only as a lightweight "After that" list (title +
  duration), not expanded.
- Actions on the current task:
  - **Start** (while `planned`) → marks it in progress.
  - **Done** → marks it complete, records actual duration (assumed equal
    to planned; no timer required, matching V1 spec), advances to the next
    item, and immediately asks the one reflection question below.
  - **Need more time** → adds 10 minutes to the planned duration in place;
    no penalty framing.
  - **I'm stuck** → shows a coaching note: *"Being stuck is information,
    not failure. What is the smallest piece of this you could still do? Or
    do you want to move it to tomorrow?"* with two calm choices: "Move to
    tomorrow" (defers the session) or "Keep going." This is the natural
    landing spot for metacognition-reflection.md's Moment C ("What
    happened?" / "What would help next time?") in a future increment —
    extend this flow rather than adding a separate one when that's built.
- When every session for the day is done: a single calm confirmation
  screen — *"That's everything for today. You did what you said you would.
  The evening is yours."* — not a stats summary.
- Empty state (nothing planned today): direct link into Planning.
- Always-available escape hatch: "Change today's plan" → back to Planning.

### Reflection

Immediately after marking a session Done, ask exactly one fixed question
— *"Did this take longer than you expected?"* — with three tap-to-answer
choices: "Shorter than I thought," "About right," "Longer than I thought."
A "Skip" option is always available and must not block progress. No free
text, no multi-question survey in this increment (Design-Principles.md
Eleventh Principle; V1 spec "One question only. No long journal.").

This is the first, simplest loop ("Calibration," Moment B) of a longer-
horizon reflection design — see
[metacognition-reflection.md](metacognition-reflection.md), which spans
many future releases (before-work prediction, missed-session reflection,
periodic pattern review, and ZPD-based scaffolding of reflection itself).
Nothing here should be extended toward that fuller design without reading
that spec first.

## Functional Requirements

- Starting a session records `session_started`; completing records
  `session_completed` (planned vs. actual minutes — objective evidence,
  Domain-Model's Behavior Observation); "need more time" records
  `session_needs_more_time`; marking stuck records `session_stuck`;
  deferring records `session_deferred`. Reflection answers record
  `reflection_recorded`.
- Deferred sessions drop out of today's list entirely (they are not
  "cancelled," just moved — the student replans them explicitly later).
- This screen never shows a timer, a running clock, or elapsed-time
  pressure of any kind (V1 spec: "No timer required").

## Acceptance Criteria

- A student can identify the current task without navigating multiple
  screens (Playwright-Test-Personas.md).
- Marking "I'm stuck" never presents judgmental language and always offers
  a concrete way forward (keep going or reschedule).
- Reflection appears after every completed session, is answerable in one
  tap, and is skippable without penalty.

## Domain Model Touchpoints

- Execution → Work Session Outcome, Blocker; Observation → Behavior
  Observation; Coaching & Learning → Reflection.
- Domain Events: `Work Session Started`, `Work Session Completed`, `Work
  Session Extended`, `Work Session Blocked`/`Missed`, `Work Session
  Rescheduled`, `Reflection Recorded`.
- Design-Principles.md Fourteenth Principle ("Progress Is More Important
  Than Perfection") is the direct source of the stuck-flow copy and the
  no-penalty defer path.

## Explicitly Out of Scope (this increment)

- A running timer or time-tracking UI.
- Before-work prediction, missed-session reflection, periodic/weekly
  pattern review, and multi-question or free-text reflection generally —
  all deferred, multi-release work specified in
  [metacognition-reflection.md](metacognition-reflection.md).
- Surfacing reflection trends anywhere in the student UI (that's coach-
  facing territory, deferred — see
  `docs/decisions/20260813-student-only-first-increment.md`).

No deviations from the prototype are proposed for this feature.
