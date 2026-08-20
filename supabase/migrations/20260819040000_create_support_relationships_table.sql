-- Real Role-Based Access (docs/features/supporter-role-based-access-feature-spec-v0.1.md)
-- Foundation table this spec's RLS policies query against. Shape follows
-- supporter-invitation-feature-spec-v0.1.md §27's SupportRelationship,
-- adapted to this codebase's established flat-FK convention (student_id/
-- supporter_id reference auth.users(id) directly, matching every other
-- table so far — see 20260815003757_create_courses_table.sql's own
-- comment on this) rather than that spec's suggested separate
-- User/StudentProfile/SupporterProfile split, which nothing in this
-- codebase otherwise has.
--
-- This migration is deliberately inert: nothing in the application can
-- create a row here yet. supporter-invitation-feature-spec-v0.1.md's own
-- invite/accept/decline flow (not built) is what will do that. Until
-- then this table exists only so real-role-based-access's RLS policies
-- (see the migration immediately after this one) have something real to
-- query, and so rows can be seeded directly for testing that access
-- model end to end.

create table public.support_relationships (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  supporter_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('parent_guardian', 'coach')),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'declined', 'expired', 'ended')),
  invited_by text not null check (invited_by in ('student', 'supporter')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  ended_at timestamptz
);

create index support_relationships_student_id_idx on public.support_relationships(student_id);
create index support_relationships_supporter_id_idx on public.support_relationships(supporter_id);

alter table public.support_relationships enable row level security;

-- A Student sees their own relationships (Pending and Active Supporters,
-- per supporter-invitation-feature-spec-v0.1.md §11) and a Supporter sees
-- their own — each is real self-interest, not a Supporter-access
-- question (that's the next migration). No insert/update/delete policy
-- yet: creating, accepting, resending, or cancelling a relationship is
-- supporter-invitation-feature-spec-v0.1.md's own unimplemented flow.
-- RLS denies by default with no matching policy, same pattern this
-- codebase already uses for every other not-yet-built write path (see
-- e.g. courses' originally-deferred delete).
create policy "Students can view their own support relationships"
  on public.support_relationships for select
  using (auth.uid() = student_id);

create policy "Supporters can view their own support relationships"
  on public.support_relationships for select
  using (auth.uid() = supporter_id);

grant select on public.support_relationships to authenticated;
