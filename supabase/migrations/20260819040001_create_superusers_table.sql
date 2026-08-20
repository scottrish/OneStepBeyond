-- Real Role-Based Access (docs/features/supporter-role-based-access-feature-spec-v0.1.md
-- §7.3) — Diagnostic Mode's access gate. Deliberately not a Support
-- Relationship role (supporter-invitation-feature-spec-v0.1.md's role
-- enum is Parent/Guardian and Coach only): a superuser can inspect any
-- Student's data for internal model/data inspection, independent of
-- whether they support that Student at all.
--
-- No insert/update/delete policy is granted to `authenticated` at all —
-- a row can only be added via direct database access (local Supabase
-- SQL), never through any application code path or client request. This
-- is the whole point: superuser status must not be self-grantable.

create table public.superusers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.superusers enable row level security;

-- A user may see only whether *they themselves* are a superuser — the
-- dashboard needs this to decide whether to show the superuser path at
-- all (see useSuperuserStatus). This does not leak who else is a
-- superuser, and superuser status isn't meaningfully secret in the first
-- place (every real guarantee comes from §7.3's other tables' RLS, not
-- from this fact being hidden).
create policy "Users can see their own superuser status"
  on public.superusers for select
  using (auth.uid() = user_id);

grant select on public.superusers to authenticated;
