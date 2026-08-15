# Feature: Assignment Capture

## Summary

Let a student record a new academic commitment (an Assignment) in under a
minute. This is the entry point into the Commitments bounded context —
capture only; understanding the assignment's requirements and breaking it
into work happens in a separate feature
([assignment-understanding-and-breakdown.md](assignment-understanding-and-breakdown.md)).

## Source

Prototype: `src/routes/assignments.new.tsx`. Validates
`docs/Playwright-Test-Personas.md`'s acceptance criterion: "Capture an
assignment in under one minute."

## User Story

As a student, I want to quickly log a new assignment so that it shows up in
my planning without having to think about it right now.

## UX Flow

Single screen, reachable from the Home header "+" and from Assignments.

1. **Course** — tap to select from the student's existing courses (chip
   buttons, single select).
2. **What is it?** — free-text title (e.g. "Chapter 7 problem set").
3. **Due** — date picker, defaults to tomorrow.
4. **How long do you think it will take?** — preset effort chips (15m, 30m,
   45m, 1h, 1.5h, 2h, 3h, 5h) rather than a free-number field. Helper copy:
   "A guess is fine. You will find out how close it was." (ties estimation
   accuracy back to reflection later.) This is the assignment-level
   instance of metacognition-reflection.md's Moment A ("Before Work:
   Prediction") — a future richer prediction step (confidence, anticipated
   challenge) should extend this and Planning's per-item estimate step
   rather than adding a third place to predict effort.
5. **Notes** (optional) — free text, multi-line.
6. Save → navigates directly to the new Assignment's detail screen.

No separate "assignment type" field is asked at capture time — type is
inferred later, during breakdown, from the title/description text.

## Functional Requirements

- Course, title, and due date are required to save; effort defaults to a
  preset value so it is never required to type.
- Save is disabled until course and title are non-empty.
- Saving creates the Assignment with `completedAt: null` and records an
  `assignment_captured` observation (course, estimate) — an objective fact,
  not an interpretation, per Domain-Model's Observation context.
- Saving navigates to the Assignment Detail screen (not back to a list),
  so the natural next action (break it down, if large) is immediately
  available.

## Acceptance Criteria

- A student can capture course, title, due date, and effort estimate in
  under one minute (Playwright-Test-Personas.md).
- Save is unavailable (disabled, not an error toast) until the required
  fields are filled.
- The assignment appears in Assignments and, if due soon, in Home's
  "Coming up" immediately after saving.

## Domain Model Touchpoints

- Commitments → Assignment (Domain-Model.md): "what the external world
  expects." Assignment Brief (the system's understanding of requirements)
  is explicitly a separate concept, captured later.
- Domain Event: `Assignment Captured`.

## Explicitly Out of Scope (this increment)

- Voice or photo capture, school system integration (Product-Vision.md
  Non-Goals; V1 spec "Future").
- Assignment type selection at capture time.
- Managing the list of courses itself — see
  [course-setup.md](course-setup.md), a prerequisite for this feature
  rather than part of it.
