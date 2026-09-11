# Student-Only First Increment

Date: 2026-08-13

**Update (2026-08-19/20):** the deferral below has ended — all five
phases of the student-only increment this record describes are built
(`docs/Roadmap.md`), and Support Relationships, real per-role access, and
a Supporter invitation flow now exist. See `docs/Roadmap.md`'s Phase 6,
`docs/decisions/20260819-dashboard-mode-toggle-replaced-by-real-access.md`,
and `docs/features/supporter-invitation-feature-spec-v0.1.md`. This
record's own Context and Decision below remain accurate as history — the
Consequences section's closing point ("start from a fresh
`analyze-feature` pass against the validated student data model") is
exactly what happened.

## Context

`docs/Product-Vision.md`'s MVP Deliverables originally listed the Parent
Dashboard and Coach Dashboard alongside the student-facing features. A
Lovable prototype (`OneStepBeyondPrototype`) was built to validate the core
executive-function-coaching experience. Its own README frames it as a
deliberate first increment ("Propose a first increment; it does not need to
cover the full prototype spec") and it implements only the student role —
no parent or coach screens, no multi-user accounts, no authentication.

The prototype is otherwise a close, well-validated implementation of
`Domain-Model.md` and `Design-Principles.md`: it embodies student ownership
of the plan, minimum-effective-scaffold coaching, capacity-aware planning,
and hidden-from-the-student risk/scaffold internals. `Domain-Model.md`
itself anticipates this scoping — the Support Network bounded context is
explicitly described as remaining "part of the long-term domain even when a
prototype implements only the student experience."

## Decision

The first implementation increment of OneStepBeyond covers the student
experience only: Home, Assignment management (including Assignment Brief
capture and guided decomposition coaching), Planning, Today execution,
Week look-ahead, Activities, risk detection, and reflection.

Parent Dashboard, Coach Dashboard, and Support Relationships (inviting a
parent/coach to a student) are deferred to a later increment, to be
specified once the student experience has been built and validated.

`docs/Product-Vision.md`'s MVP Deliverables section has been restructured
into "Increment 1 — Student Experience" and "Later Increments — Deferred"
to reflect this.

## Alternatives considered

- **Build all three roles now.** Rejected: there is no validated prototype
  reference for parent or coach screens, so specifying them now would be
  speculative design produced ahead of any user testing — the opposite of
  this project's stated implementation philosophy (small, independently
  testable increments; avoid speculative generalization).
- **Build parent/coach as stubs/placeholders alongside the student build.**
  Rejected: adds surface area (routes, empty states, nav entries) with no
  behavior to test, for no near-term benefit, and risks the student
  experience being built to accommodate hypothetical future screens.

## Consequences

- Multi-user accounts, per-role authentication, and Support Relationship
  data model work are deferred along with the dashboards themselves; the
  first increment only needs to support a single authenticated student.
- Feature specifications under `docs/features/` for this increment describe
  the student experience only.
- When parent/coach work begins, it should start from a fresh
  `analyze-feature` pass against the (then-validated) student data model,
  not from assumptions made now.
