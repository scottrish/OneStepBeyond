# Executive Function Coach

## Real Role-Based Access — Feature Specification

Version 0.1

**Status:** Implemented (2026-08-19), merged to `main`, by direct
product-owner instruction. Drafted in response to a spec review of
`supporter-invitation-feature-spec-v0.1.md` that found its own Acceptance
Criteria ("Parent receives Parent dashboard access," "Coach receives
Coach dashboard access") had nothing to attach to — the dashboard's
Coach/Parent/Diagnostic modes were a client-side toggle with no backend
enforcement (see §2). This spec is that missing piece: it does not
re-specify invitations or the dashboard's screens, only how access to
them becomes real. See
`docs/decisions/20260819-dashboard-mode-toggle-replaced-by-real-access.md`
for the superseding decision record.

**What shipped:** `support_relationships` and `superusers` tables;
additive Supporter- and superuser-read RLS policies on the five tables
the dashboard actually queries (`courses`, `assignments`, `work_items`,
`decomposition_attempts`, `reflections`); `DashboardApp.tsx` rewritten to
resolve access from `useSupporterAccess` (Active relationships +
superuser status) instead of a free `useMode()` toggle — 0 relationships
denies access, 1 auto-opens at that relationship's role, 2+ shows a
picker; Diagnostic Mode reachable only via superuser status, with its own
student picker (`listKnownStudentIds`), never via any Support
Relationship. Verified live against the real local Postgres/RLS stack —
schema-migration-reviewer found no drift. **Not shipped, still separate,
future work:** `supporter-invitation-feature-spec-v0.1.md`'s own
invite/accept/decline UI — nothing in the application can create a
`support_relationships` row yet; rows for testing are seeded directly.
RLS additions for `activities`/`work_sessions`/`planning_sessions`/
`student_preferences` are deferred until a dashboard screen actually
reads them (§6/§8, unchanged from the original draft).

---

# 1. Purpose

Replace the dashboard's client-side mode toggle with access that is
actually enforced at the data layer: a Supporter can read a specific
Student's data if and only if an **Active** Support Relationship exists
between them, for the role that relationship grants — not because they
happen to hold the Student's own login, and not because they clicked a
mode button.

This spec answers one question: **once a Support Relationship exists, how
does the resulting session actually get scoped access?** It assumes the
Support Relationship itself — invitation, acceptance, roles, statuses —
already exists as designed in `supporter-invitation-feature-spec-v0.1.md`
and does not redesign it.

---

# 2. Relationship to Other Specs

**Depends on:** `supporter-invitation-feature-spec-v0.1.md` — this spec
consumes its `SupportRelationship` data model (§27) and status lifecycle
(§3) as given. If that spec's shape changes, this one's RLS predicates
change with it.

**Amends:** `coach-parent-dashboard-feature-spec-v0.1.md` — specifically
its Implementation Note and §26 Privacy and Trust, both of which describe
the current mode-toggle as an explicit, temporary stand-in "until that
[Support Relationship] foundation exists." This spec is that foundation.
The dashboard's screens, content, and phased capability roadmap (§23 of
that spec) are unaffected — only *how a session is granted the right to
see a given Student's data* changes.

**Supersedes:** the access-control portion of
`docs/decisions/20260816-dashboard-reuses-student-auth.md`. That
record's own Consequences section anticipated this: *"When Support
Relationships are eventually built, the dashboard's mode toggle should be
replaced by real role-based routing/auth, not layered on top of it."*
Implementing this spec is that replacement. A new decision record should
be written at implementation time recording that the "reuses student
auth" simplification has ended — this document does not create that
record itself, since nothing is built yet.

**Relates to:** `docs/decisions/20260813-student-only-first-increment.md`,
which deferred Support Relationships and per-role auth "to be specified
once the student experience has been built and validated." Scheduling
this spec for implementation is an explicit decision that gate has been
crossed. That decision belongs to the product owner, not to this
document — see the review that prompted this spec for that framing.

---

# 3. Product Principle

Access is a consequence of an Active Support Relationship, never of
authentication alone and never of a client-side choice.

```text
Signed-in session
      +
Active Support Relationship (student, supporter, role)
      ↓
Scoped read access to that one Student's data, at that role's visibility
```

Remove the session, remove or end the relationship, and access ends —
enforced by the database, not by which screen the client happens to
render.

---

# 4. Domain Concepts

No new domain entities. This spec is an access-control layer over
entities `supporter-invitation-feature-spec-v0.1.md` and
`Domain-Model.md`'s Support Network context already define:

- **Student**, **Supporter**, **Support Relationship** (`studentId`,
  `supporterId`, `role`, `status`, ...) — reused as-is.
- Only `status = Active` relationships grant access. `Pending`,
  `Declined`, `Expired`, and `Ended` grant none.

`Domain-Model.md` explicitly places authentication outside the domain
(see its "Explicitly Outside the Domain" section). This spec lives at
that boundary — Support Relationship *state* is domain; how a Postgres
session proves it holds a given `auth.uid()` is not.

---

# 5. Current State (what this replaces)

Today, per `coach-parent-dashboard-feature-spec-v0.1.md`'s Implementation
Note:

- The dashboard is reached by signing in with the same Supabase account
  the mobile app uses. There is no separate Supporter identity.
- Coach / Parent / Diagnostic are chosen by a client-side toggle
  (`ModeProvider`/`useMode()`, ported from the prototype). Any signed-in
  session can switch to any mode.
- Every RLS policy in `supabase/migrations/` is scoped to `auth.uid() =
  student_id` (or an equivalent join), with no cross-user read policy of
  any kind.
- The build must not be shown to a real third-party parent or coach using
  their own credentials.

This spec changes all four points.

---

# 6. Scope

## In Scope

- A `support_relationships` table (already specified by
  `supporter-invitation-feature-spec-v0.1.md` §27) becomes the source of
  truth RLS policies query against.
- Additive `SELECT` RLS policies on every existing Student-scoped table,
  granting a Supporter read access to rows belonging to a Student they
  hold an Active relationship with.
- No `INSERT`/`UPDATE`/`DELETE` policy is added for Supporters on any
  Student-owned table, anywhere — enforces "a Supporter never becomes
  owner" (`supporter-invitation-feature-spec-v0.1.md` §5) at the database
  layer, not only the UI layer.
- Dashboard session/role resolution: on load, resolve the signed-in
  user's Active relationships; require a Student selection when more than
  one exists; derive Coach vs. Parent visibility from that relationship's
  own `role`, not a free-standing toggle.
- Removing the ability for an arbitrary signed-in session to reach
  Diagnostic Mode or any Student's data it has no relationship to.
  Diagnostic Mode itself moves to a superuser-only gate (§7.3), not a
  Support Relationship role — a Supporter's own Active relationships,
  however many, never grant it.
- A migration/rollout plan that keeps internal dev/test access working
  without reintroducing an unscoped bypass reachable by a normal session.

## Out of Scope

- Anything already covered by `supporter-invitation-feature-spec-v0.1.md`
  (invite/accept/decline UX, invitation tokens and expiry, resend/cancel,
  duplicate-invitation handling).
- Any change to the dashboard's screens, content, or phased capability
  roadmap (`coach-parent-dashboard-feature-spec-v0.1.md` §23) beyond how
  access to them is granted.
- Granular/per-field permissions — an Active relationship grants its
  role's full, already-specified visibility; nothing finer-grained.
- School/organization accounts, coach caseload tooling, billing.
- Write access for Supporters of any kind (already out of scope
  everywhere else in this product; restated here because it's the
  specific thing RLS now enforces rather than merely implies).

---

# 7. Access Model

## 7.1 No separate account "type"

A signed-in user is not permanently "a Student account" or "a Supporter
account." Per `supporter-invitation-feature-spec-v0.1.md` §27's own
guidance ("Avoid making Student and Supporter account types permanently
mutually exclusive"), the same `auth.uid()` may:

- use the mobile app as a Student (existing behavior, unaffected), and/or
- use the dashboard as a Supporter for one or more other Students, if
  Active relationships naming them as `supporterId` exist.

Role is resolved per request from relationship rows, not stored as a
fixed attribute of the account.

## 7.2 Role resolution at dashboard entry

```text
Dashboard session starts
      ↓
Query support_relationships where supporterId = auth.uid() and status = Active
      ↓
0 results  → deny: "You don't currently support any students."
1 result   → open that Student's dashboard at that relationship's role
2+ results → Student selector (matching supporter-invitation §28's
             "My Student Workspace / Supporting Alex / Supporting Sam"
             pattern), then open the chosen relationship's role
```

The Coach/Parent visibility split (`coach-parent-dashboard-feature-spec-
v0.1.md` §5) is now **derived from the selected relationship's `role`**,
not chosen freely. A Supporter who is a Parent for one Student and a
Coach for another sees the correct mode for whichever Student is
selected, automatically.

## 7.3 Diagnostic Mode requires superuser access — never Supporter access

Diagnostic Mode is not a Support Relationship role
(`supporter-invitation-feature-spec-v0.1.md`'s role enum is Parent /
Guardian and Coach only) and was never meant to represent one — it exists
for internal model/data inspection across *any* Student, which is a
fundamentally different, higher-privilege capability than "the specific
Students who invited me." **Direct product-owner decision (2026-08-19):
Diagnostic Mode requires a superuser level of access. It is not intended
to be used by a Supporter** — not even a Supporter with one or more
legitimate Active relationships. Holding an Active relationship grants
exactly that relationship's role-appropriate visibility for that Student
and nothing more; it must never be a path to Diagnostic Mode for any
Student, including ones the Supporter genuinely supports.

**Mechanism:** a `superusers` table (`user_id` referencing `auth.users`,
matching this codebase's flat-FK convention rather than a JWT-claim
approach), with no `INSERT`/`UPDATE`/`DELETE` policy granted to
`authenticated` at all — a row can only be added via direct database
access (the same "local Supabase, single developer" trust boundary this
project's other admin-only operations already rely on), never through any
application code path or client request. Each in-scope table's RLS gains
a second additive `SELECT` policy:

```sql
create policy "superusers_read_all_students_data"
  on public.<table> for select
  using (
    exists (
      select 1 from public.superusers su
      where su.user_id = auth.uid()
    )
  );
```

This is deliberately **not** the `service_role` key / a server-side-only
endpoint (an earlier draft of this spec considered that) — this
codebase has no server layer beyond Supabase itself (`CLAUDE.md`'s
engineering standards: React/TypeScript/Vite/Supabase, no separate
backend service), so inventing one just to gate Diagnostics would be new
infrastructure this spec doesn't otherwise need. A superuser flag checked
by RLS fits the architecture already in place and gets the same
guarantee: superuser status is never client-settable, since ordinary
`authenticated` sessions have no write path to the `superusers` table at
all.

Real Parent/Coach sessions must not be able to reach Diagnostic Mode by
any client-side action (URL edit, mode switch, stored state, etc.) — this
holds at the RLS layer (a non-superuser read returns nothing) regardless
of what the UI does or doesn't show.

---

# 8. Data Model / RLS Changes

Reuses `supporter-invitation-feature-spec-v0.1.md` §27's
`SupportRelationship` shape. Conceptual policy pattern, one per existing
Student-scoped table (`courses`, `assignments`, `activities`,
`work_items`, `decomposition_attempts`, `reflections`, `work_sessions`,
`planning_sessions`, `student_preferences`, and any added since):

```sql
create policy "supporters_read_active_students_data"
on <table> for select
using (
  exists (
    select 1 from support_relationships sr
    where sr.student_id = <table>.student_id  -- or the correct join,
                                                 -- e.g. via assignment_id
                                                 -- for work_items
      and sr.supporter_id = auth.uid()
      and sr.status = 'active'
  )
);
```

Postgres RLS policies for the same command are OR'd together, so this is
purely additive next to each table's existing `auth.uid() = student_id`
owner policy — no existing policy needs to change.

Tables where the Student relationship isn't a direct column (e.g.
`work_items` reaches it via `assignment_id → assignments.student_id`)
need the join written out per table; this is not a single copy-pasted
policy and needs per-table review during implementation.

Each in-scope table therefore ends up with three `SELECT` policies,
independently satisfiable (Postgres OR's multiple permissive policies for
the same command): the existing owner policy (`auth.uid() = student_id`),
this Supporter policy, and §7.3's superuser policy. None of the three
grants any write access.

**Every migration this spec produces touches RLS policies referencing a
status enum value (`status = 'active'`) across most of the schema — per
`CLAUDE.md`, the `schema-migration-reviewer` agent must review each one
before considering the migration done.**

---

# 9. Security Requirements

- RLS is the enforcement boundary. Client-side mode/role selection is
  display-only and must never be treated as an authorization check
  anywhere in application code.
- A relationship's `status` transitioning away from `Active` (Ended,
  Declined, Expired) must take effect on the very next request — no
  session-cached role that outlives the relationship.
- No endpoint or query path may accept a Student id from client input
  without the RLS policy independently proving the requester holds an
  Active relationship to it — the policy is the guarantee, not a
  server-side "trust the request" check layered in front of it.
- Diagnostic Mode's superuser gate (§7.3) must be unreachable from any
  session that isn't a superuser — including a Supporter's own session,
  even for a Student they genuinely support — verified explicitly (not
  merely "no button links to it").
- Superuser status must never be grantable through any application code
  path or client request — no signup flow, no invitation, no self-service
  action of any kind produces a `superusers` row. It is provisioned only
  by direct database access, the same trust boundary this project's other
  admin-only operations already rely on.

---

# 10. Privacy Requirements

Turns `coach-parent-dashboard-feature-spec-v0.1.md` §26's stated-but-
unenforced principles into enforced ones:

- **Minimum necessary adult access** — a Supporter can read exactly the
  Students they hold an Active relationship with; nothing else.
- **Clear role separation** — Coach vs. Parent visibility is derived from
  the relationship's own role, per Student, not selectable.
- **No covert monitoring** — access requires the Student's own acceptance
  (`supporter-invitation-feature-spec-v0.1.md`'s Accept flow), which this
  spec's RLS policies enforce by keying strictly off `status = 'active'`.
- **Ending a relationship ends future access** — immediately, at the
  database layer, not just hidden in the UI.
- Historical audit records (Ended relationships, past
  Decomposition Attempts, etc.) may remain internally per
  `supporter-invitation-feature-spec-v0.1.md` §12 — this spec does not
  change retention, only live read access.

---

# 11. Migration / Rollout Plan

The dashboard already ships and is used for internal development against
real data. This spec must not silently break that.

1. Add `support_relationships` and the new RLS policies (additive; no
   existing behavior changes yet, since nothing creates relationship rows
   until `supporter-invitation-feature-spec-v0.1.md` ships).
2. Ship `supporter-invitation-feature-spec-v0.1.md`'s Phase 1 (Student-
   initiated invitations), so Active relationships can actually exist.
3. Rebuild dashboard entry (§7.2) to resolve role from relationships
   instead of the `useMode()` toggle. At this point the single-shared-
   student-login path stops granting dashboard access by itself — an
   internal tester needs an Active relationship of their own, or uses the
   Diagnostic path (§7.3).
4. Remove `ModeProvider`/`useMode()` and the free mode toggle from the
   dashboard UI once step 3 ships — do not leave both mechanisms live
   simultaneously; that would reintroduce the exact bypass this spec
   closes.
5. Update `coach-parent-dashboard-feature-spec-v0.1.md`'s Implementation
   Note and §26 to remove the "not implemented as enforced guarantees"
   caveat once this ships, and record the superseding decision (see §2
   above).

---

# 12. Diagnostic / Test Requirements

Diagnostic Mode's own requirements (entity/event/projection inspectors —
`coach-parent-dashboard-feature-spec-v0.1.md` §17) are unchanged in
content; only their access path changes (§7.3).

New fixtures needed for this spec specifically:

```text
supporter-no-relationships          (denied at dashboard entry)
supporter-one-active-relationship   (auto-opens that student)
supporter-multiple-active           (student selector shown)
supporter-relationship-ended        (access denied post-end, same session)
supporter-relationship-pending-only (denied — pending grants nothing)
supporter-with-active-relationship-attempts-diagnostics
                                     (denied — Active relationship grants
                                     that relationship's role only, never
                                     Diagnostic Mode)
superuser-account                   (reaches Diagnostic Mode for any
                                     student, with no relationship needed)
```

---

# 13. Playwright Scenarios

## A — Access granted only after acceptance

1. Student invites Coach; relationship is Pending.
2. Coach signs in to the dashboard.
3. Verify: no Student data reachable, no bypass via direct URL.
4. Coach accepts; relationship becomes Active.
5. Coach reloads the dashboard.
6. Verify: the Student is now reachable, at Coach-mode visibility.

## B — Access ends immediately when the relationship ends

1. Active Coach relationship exists; Coach can see the Student.
2. Student ends the relationship.
3. Coach's existing session issues the same read it did a moment ago.
4. Verify: the read is denied — not merely hidden in the UI.

## C — Role is derived, not chosen

1. Supporter is Parent for Student A and Coach for Student B.
2. Supporter opens Student A's dashboard — verify Parent-mode visibility,
   with no way to switch to Coach mode for Student A.
3. Supporter opens Student B's dashboard — verify Coach-mode visibility.

## D — Diagnostic Mode requires superuser access, not a Support Relationship

1. A real Parent or Coach session — including one with a genuine Active
   relationship to the Student in question — attempts to reach Diagnostic
   Mode by direct URL / stored client state.
2. Verify: denied, regardless of client-side attempt or how strong the
   Supporter's own relationship to that Student is.
3. A superuser account (no Support Relationship to the Student at all)
   opens Diagnostic Mode for that same Student.
4. Verify: access granted — superuser status, not relationship status, is
   what Diagnostic Mode checks.

## E — No account has default access

1. A freshly signed-up account with zero Support Relationships opens the
   dashboard.
2. Verify: denied with a clear "you don't currently support any
   students" message — not an empty-but-reachable dashboard shell.

---

# 14. Risks / Open Questions

- **Same Student, same Supporter, two roles.** The domain model doesn't
  forbid a Supporter holding both a Parent and a Coach relationship with
  the same Student. This spec doesn't design merged visibility for that
  case — treat it as an edge case to resolve during implementation
  (e.g. union of both roles' visibility, or require the Student to pick
  one) rather than something this spec should over-design ahead of a
  real occurrence.
- **Session/role caching.** If the dashboard client caches role/visibility
  client-side for the session's duration, §9's "next request" requirement
  needs the client to re-check on each sensitive load, not just once at
  login. Needs an explicit implementation decision, not assumed away.
- **Diagnostic Mode's mechanism is now settled** (§7.3: a `superusers`
  table checked by RLS, not a separate server endpoint) — the remaining
  open question is narrower: how are `superusers` rows actually
  provisioned per environment (local dev vs. whatever deployed
  environment eventually exists)? Direct database access is sufficient
  for this project's current "local Supabase, single developer" reality;
  revisit if/when a shared or hosted environment exists and "direct
  database access" stops meaning "anyone on the team, informally."

---

# 15. Acceptance Criteria

- A Supporter with no Active relationship to a Student cannot read that
  Student's data through any dashboard path, including Diagnostic Mode.
- A Supporter's access to a Student's data starts only once that specific
  relationship's status is Active, and stops immediately once it no
  longer is (Ended, Declined, Expired) — verified as a database-level
  guarantee (a direct query with that Supporter's `auth.uid()`), not only
  as a UI behavior.
- Coach vs. Parent visibility for a given Student is always the visibility
  their actual relationship role grants — never independently selectable.
- No client-side toggle can grant a session access it doesn't otherwise
  have.
- Diagnostic Mode is unreachable from any real, normally-authenticated
  Coach/Parent session — including one with a genuine Active relationship
  to the Student being requested. Only a superuser account can reach it.
- No client action, invitation, or signup path can produce a
  `superusers` row for any account.
- Every existing Student-scoped table has an explicit, reviewed RLS
  policy for Supporter read access (or an explicit, documented reason it
  intentionally has none — e.g. a table with no Supporter-relevant data).
- No new `INSERT`/`UPDATE`/`DELETE` policy exists for Supporters anywhere.

---

# 16. Definition of Success

A Parent or Coach can be shown into the dashboard using their own real
account, see exactly the Students who invited them and nothing else, at
the visibility their role grants — and that guarantee holds even if the
UI has a bug, because the database enforces it independently of what the
client renders.
