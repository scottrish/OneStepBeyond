-- Manual Work Breakdown + Reflection (docs/features/manual-work-breakdown-reflection-v0.1.md)
-- Records a Reflection (Domain-Model.md's Coaching & Learning context) —
-- the student's own account of whether their Work Breakdown worked,
-- deliberately kept distinguishable from objective Behavior Observation
-- (Domain Invariant 11). This increment only records the Work Breakdown
-- Reflection Moment (metacognition-reflection-feature-spec-v0.2.md §7);
-- structured_response/free_text/proposed_adjustment are stored as plain
-- text exactly as the student chose/typed, never rewritten into a
-- system-asserted fact.

create table public.reflections (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  trigger text not null,
  structured_response text not null,
  free_text text,
  proposed_adjustment text,
  scaffold_intensity text not null default 'Structured',
  occurred_at timestamptz not null default now()
);

create index reflections_student_id_idx on public.reflections(student_id);
create index reflections_assignment_id_idx on public.reflections(assignment_id);

alter table public.reflections enable row level security;

create policy "Students can view their own reflections"
  on public.reflections for select
  using (auth.uid() = student_id);

create policy "Students can record reflections on their own assignments"
  on public.reflections for insert
  with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.assignments a
      where a.id = assignment_id and a.student_id = auth.uid()
    )
  );

-- No update/delete: a reflection is a historical record of what the
-- student said at the time, not a value meant to be revised later.
grant select, insert on public.reflections to authenticated;
