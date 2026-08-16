-- Manual Work Breakdown (docs/features/manual-work-breakdown-reflection-v0.1.md)
-- Records one DecompositionAttempt per confirmed "Break this down" flow
-- (Domain-Model.md's Planning context). Evidence only this increment —
-- ScaffoldIntensity is always 'None' and assistance_requested is always
-- false, since no coaching/scaffolding exists yet — stored as real
-- columns (not hardcoded in application code) so later phases can start
-- writing real values with no migration. See
-- docs/decisions/20260815-manual-work-breakdown-draft-state.md for why
-- this table is written once, at confirmation, rather than per keystroke.
--
-- student_id is denormalized here (also derivable via assignment_id ->
-- assignments.student_id), matching every other table's RLS pattern so
-- far (see work_items).

create table public.decomposition_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  initial_work_items jsonb not null default '[]'::jsonb,
  resulting_work_items jsonb not null default '[]'::jsonb,
  revision_count integer not null default 0,
  assistance_requested boolean not null default false,
  initial_scaffold_intensity text not null default 'None',
  highest_scaffold_intensity text not null default 'None',
  scaffolds_provided jsonb not null default '[]'::jsonb,
  outcome text not null,
  occurred_at timestamptz not null default now()
);

create index decomposition_attempts_student_id_idx on public.decomposition_attempts(student_id);
create index decomposition_attempts_assignment_id_idx on public.decomposition_attempts(assignment_id);

alter table public.decomposition_attempts enable row level security;

create policy "Students can view their own decomposition attempts"
  on public.decomposition_attempts for select
  using (auth.uid() = student_id);

-- Mirrors work_items' own insert policy: WITH CHECK verifies both the
-- row's own student_id AND that assignment_id actually belongs to that
-- student, not just that the row exists (assignments is select-granted
-- to all authenticated users, so existence alone isn't an ownership
-- guarantee).
create policy "Students can record decomposition attempts on their own assignments"
  on public.decomposition_attempts for insert
  with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.assignments a
      where a.id = assignment_id and a.student_id = auth.uid()
    )
  );

-- No update/delete: an attempt is a historical record, same reasoning as
-- assignments' own captured-observation rows.
grant select, insert on public.decomposition_attempts to authenticated;
