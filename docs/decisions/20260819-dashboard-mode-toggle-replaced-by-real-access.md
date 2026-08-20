# Dashboard mode toggle replaced by real, RLS-enforced access

Date: 2026-08-19

## Context

`docs/decisions/20260816-dashboard-reuses-student-auth.md` deliberately
shipped the Coach/Parent/Diagnostic dashboard with no real Support
Relationship model: the dashboard is reached by signing in with the same
student account the mobile app uses, and Coach/Parent/Diagnostic are a
client-side display toggle only, not a backend access level. That
record's own Consequences section named this as temporary: *"When
Support Relationships are eventually built, the dashboard's mode toggle
should be replaced by real role-based routing/auth, not layered on top
of it."*

`docs/features/supporter-role-based-access-feature-spec-v0.1.md` is that
replacement, drafted after a review of
`docs/features/supporter-invitation-feature-spec-v0.1.md` found its own
Acceptance Criteria ("Parent receives Parent dashboard access") had
nothing enforcing them. Implementing it is a direct decision that
`docs/decisions/20260813-student-only-first-increment.md`'s deferral gate
— "Parent Dashboard, Coach Dashboard, and Support Relationships... to be
specified once the student experience has been built and validated" —
has now been crossed for the access-control portion of that work. Direct
product-owner instruction to implement.

## Decision

1. **Access to a Student's data is now determined by an Active
   `support_relationships` row, enforced by Postgres RLS** — not by
   holding the Student's own login, and not by a client-side mode choice.
   See `supporter-role-based-access-feature-spec-v0.1.md` §7–§10 for the
   full model.
2. **Diagnostic Mode requires superuser access** (a `superusers` table,
   provisioned only by direct database access — never through any
   application code path), not a Support Relationship. A Supporter, no
   matter how many Active relationships they hold, never reaches it.
3. **`ModeProvider`/`useMode()`-style free mode selection and its
   `localStorage` persistence are removed.** `DashboardMode` is derived
   from the resolved relationship's `role` (Supporter) or is always
   `"diagnostic"` (superuser) — never chosen by the viewer.
4. **`supporter-invitation-feature-spec-v0.1.md`'s own invite/accept/
   decline UI is explicitly not part of this increment.** The
   `support_relationships` table exists and is queried by the new RLS
   policies, but nothing in the application can create a row in it yet —
   rows for testing are seeded directly (see that spec's own Migration
   Plan §11, step 1). Building the invitation flow itself remains
   separate, future work.
5. **RLS additions are scoped to the five tables the dashboard actually
   queries today** (`courses`, `assignments`, `work_items`,
   `decomposition_attempts`, `reflections`) rather than every Student-
   scoped table in the schema — `activities`, `work_sessions`,
   `planning_sessions`, and `student_preferences` get their own policy,
   in their own small migration, whenever a dashboard screen actually
   reads them (Domain-Model.md Core Principle #12: "Do not add complexity
   without demonstrated value").

## Alternatives considered

- **Wait for `supporter-invitation-feature-spec-v0.1.md`'s UI to ship
  first, then build access control on top of real invitation data.**
  Rejected for this increment by direct instruction — the access-control
  layer is independently valuable (it's what makes the invitation spec
  safe to build at all) and is inert without invitation rows regardless
  of build order.
- **Gate Diagnostic Mode behind a Support Relationship role** (e.g. an
  internal "diagnostic" role alongside Parent/Guardian and Coach).
  Rejected by direct product-owner instruction: *"Diagnostic mode should
  require a superuser level of access. It is not intended to be used by
  a supporter."* Modeling it as a relationship role would have made it
  reachable through the exact invitation flow this spec exists to
  constrain.
- **Gate superuser access behind a `service_role`-backed server
  endpoint.** Rejected — this codebase has no server layer beyond
  Supabase itself; a `superusers` table checked by RLS achieves the same
  non-client-settable guarantee without new infrastructure.

## Consequences

- The dashboard's previously-frictionless internal dev access (any
  signed-in student account, any mode) is gone. An internal tester now
  needs either a `superusers` row (direct database access) or a manually
  seeded Active `support_relationships` row to reach anything.
- `docs/features/coach-parent-dashboard-feature-spec-v0.1.md`'s
  Implementation Note and §26 Privacy and Trust described this exact
  limitation as temporary and should be updated to reflect that the
  access-control portion is no longer a caveat (see that spec's own
  updated status).
- `docs/features/supporter-invitation-feature-spec-v0.1.md` remains
  unimplemented. Its own Acceptance Criteria around dashboard access now
  have something real to attach to; its invitation UI itself is still
  future work.
- Future work extending Supporter-readable data to additional tables
  should add its own small, reviewed migration per table rather than
  broadening these policies after the fact.
