# Local Supabase for Initial Development

Date: 2026-08-14

## Context

CLAUDE.md's stack already names Supabase, and `src/lib/supabase.ts` /
`useAuth.ts` are already scaffolded against it, but no hosted Supabase
project has been created yet — `.env.local` currently points at a
placeholder URL. Increment 1's feature specs (`docs/features/*.md`) need
real persistence and real Row Level Security (RLS) to build and test
against, and provisioning a hosted project first would mean making
org-level decisions (which Supabase organization, environment naming,
billing ownership) that are outside this repo's scope and not blocking to
resolve before writing schema or application code.

## Decision

Develop and test against a **local Supabase stack** (Supabase CLI + Docker:
Postgres, Auth, Storage, Studio) for all initial development, schema
migrations, and automated/persona testing. No hosted Supabase project
exists yet. `supabase/migrations/` is the source of truth and will be
applied to a hosted project once one is provisioned — see `DEVELOPMENT.md`
for the concrete day-to-day workflow.

## Alternatives considered

- **Provision a hosted (free-tier) Supabase project immediately.** Rejected
  for now: adds an external dependency (account/org setup, credential
  management, a network dependency for every dev and test run) before
  there's any schema to actually host, and blocks development on an
  out-of-repo decision. Moving to a hosted project later requires no code
  changes — the CLI's migration workflow applies identically to a hosted
  project via `supabase link` + `supabase db push`.
- **Mock the Supabase client for local dev instead of running real
  Postgres.** Rejected: RLS policies are a first-class part of this
  design (Domain-Model.md's per-student data ownership; increment 1's
  single-student-per-account scoping) and can only be meaningfully tested
  against a real Postgres instance enforcing them. A mock would let broken
  RLS pass silently.

## Consequences

- Everyone developing locally needs Docker and the Supabase CLI
  (documented in `DEVELOPMENT.md`).
- CI, once set up, needs the same local-stack approach (`supabase start`
  in the pipeline) until a hosted project exists.
- `.env.local` points at the local stack's URL/anon key, never a real
  project — the same "never commit real credentials" discipline applies
  once a hosted project exists too.
- Moving to a hosted project later is a deliberate, separately-tagged
  increment (per this repo's tagging convention), not an incidental step:
  provision the project, `supabase link`, `supabase db push`, swap env
  vars. No application code changes are expected at that point.
