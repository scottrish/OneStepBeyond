-- Assignment Management (docs/features/assignment-management.md)
-- Minimal, manually-created Work Items ("Add another step" on Assignment
-- Detail) — not the guided-breakdown machinery (archetypes, scaffold
-- levels), which is assignment-understanding-and-breakdown.md's own
-- future increment. student_id is denormalized here (also derivable via
-- assignment_id -> assignments.student_id) purely so RLS can scope
-- directly on this table without a join, matching every other table so
-- far.

create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  effort_minutes integer not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index work_items_student_id_idx on public.work_items(student_id);
create index work_items_assignment_id_idx on public.work_items(assignment_id);

alter table public.work_items enable row level security;

create policy "Students can view their own work items"
  on public.work_items for select
  using (auth.uid() = student_id);

-- Mirrors assignments' own insert policy: WITH CHECK verifies both the
-- work item's own student_id AND that assignment_id actually belongs to
-- that student, not just that the row exists (assignments is
-- select-granted to all authenticated users, so existence alone isn't
-- an ownership guarantee).
create policy "Students can create work items on their own assignments"
  on public.work_items for insert
  with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.assignments a
      where a.id = assignment_id and a.student_id = auth.uid()
    )
  );

-- Update is needed for "Mark assignment complete" to complete all of an
-- assignment's open steps in the same action (docs/features/assignment-management.md).
-- WITH CHECK re-verifies assignment_id ownership too, not just
-- student_id — without it, a student could UPDATE a work item they own
-- to point assignment_id at another student's assignment, since
-- USING only checks the *old* row and student_id alone doesn't change.
create policy "Students can update their own work items"
  on public.work_items for update
  using (auth.uid() = student_id)
  with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.assignments a
      where a.id = assignment_id and a.student_id = auth.uid()
    )
  );

grant select, insert, update on public.work_items to authenticated;
