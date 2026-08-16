# Coach/Parent/Diagnostic Dashboard reuses student auth; no real roles yet

Date: 2026-08-16

## Context

`docs/features/coach-parent-dashboard-feature-spec-v0.1.md`'s own Phase 1
scope implicitly assumes a Coach or Parent can authenticate as themselves
and be granted read access to a specific student's data. That requires a
Support Relationship data model and per-role authentication —
`docs/decisions/20260813-student-only-first-increment.md` explicitly
deferred exactly this ("Parent Dashboard, Coach Dashboard, and Support
Relationships... to a later increment, to be specified once the student
experience has been built and validated"), and
`docs/reference/Product-Vision.md` independently lists "parent and coach
dashboards" under "Deferred From the Initial Student Experience." Neither
exists: every RLS policy in this codebase so far is scoped to `auth.uid()
= student_id` with no cross-user access of any kind.

Building that foundation is a real increment of its own — new tables
(`supporters`, `support_relationships`), new RLS predicates across every
existing table, and a second authentication path — not something to
absorb as a side effect of wanting to look at dashboard screens during
development.

## Decision

For this increment, the dashboard is reached by signing in with the same
student Supabase account already used by the mobile app. There is no
separate coach/parent identity, no Support Relationship record, and no
backend-enforced difference between Coach, Parent, and Diagnostic access
— those three are **client-side display modes only** (a toggle,
following `OneStepBeyondPrototype`'s own `ModeProvider`/`useMode()`
pattern), not authorization levels. The dashboard lives at its own route,
entirely outside the mobile `AppShell`, with no navigation link between
the two — "distinct URL, no combined UI."

This is a deliberate, temporary simplification for internal development
and testing use — exactly the dashboard's own stated "Product testing and
model validation" purpose (§1 of the feature spec) — not a claim that
Parent Mode's restrictions constitute real privacy protection. Anyone who
can sign in as the student can already see everything behind every mode.

## Alternatives considered

- **Build Support Relationships + real per-role auth first.** Rejected
  for now: correct long-term design, but a substantially larger and
  differently-shaped effort than "look at the evidence the manual Work
  Breakdown increment already recorded" — the actual near-term need.
  Nothing about building the dashboard's read-only projections now
  forecloses doing this properly later; the projection layer doesn't care
  how the viewer authenticated.
- **Stub a fake coach/parent login with no real backend distinction.**
  Rejected as more complex than reusing the student's real session for no
  real benefit — there's no second identity to stub yet, so a fake login
  screen would just be UI theater in front of the same single account.

## Consequences

- `docs/features/coach-parent-dashboard-feature-spec-v0.1.md` needed an
  explicit implementation note (added) so this simplification isn't
  mistaken for the spec's eventual real access model, especially against
  §26 "Privacy and Trust," which describes a target state this increment
  does not implement.
- When Support Relationships are eventually built, the dashboard's mode
  toggle should be replaced by real role-based routing/auth, not layered
  on top of it — the client-side `useMode()` pattern is explicitly a
  stand-in, not infrastructure to build further on.
- The dashboard must not be exposed to a real third-party parent or coach
  in this state — it grants full access to whoever holds the student's
  own login.
