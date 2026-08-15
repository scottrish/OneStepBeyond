-- Assignment Capture (docs/features/assignment-capture.md)
-- A student's captured academic commitments. Single-owner table, same
-- shape as courses (see 20260815003757_create_courses_table.sql):
-- student_id references auth.users directly, RLS scoped per-row.
--
-- No separate "observation" record is created here for the
-- assignment_captured event the spec mentions — this row's own
-- (student_id, course_id, effort_minutes, created_at) already carries
-- that fact, and nothing yet consumes a dedicated Observation log (see
-- Domain-Model.md's Observation context). Revisit when a feature (e.g.
-- estimate-comparison coaching) actually needs to query observations
-- independently of the Assignment they came from.
--
-- Only select + insert are granted this increment: there is no edit or
-- delete UI yet (assignment-management.md, not built), so update/delete
-- policies would be unused and unreachable — RLS denies by default with
-- no matching policy, same pattern as courses' deferred delete.

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id),
  title text not null check (char_length(trim(title)) > 0),
  due_date date not null,
  effort_minutes integer not null,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index assignments_student_id_idx on public.assignments(student_id);
create index assignments_course_id_idx on public.assignments(course_id);

alter table public.assignments enable row level security;

create policy "Students can view their own assignments"
  on public.assignments for select
  using (auth.uid() = student_id);

-- WITH CHECK verifies both the assignment's own student_id AND that
-- course_id refers to a course actually owned by that student — the FK
-- to public.courses(id) alone only guarantees the row exists, not that
-- it belongs to the inserting student. Without the second condition, a
-- student could attach their assignment to another student's course_id
-- (courses are select-granted to all authenticated users) and corrupt
-- that other student's course-grouped assignment data.
create policy "Students can create their own assignments"
  on public.assignments for insert
  with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.courses c
      where c.id = course_id and c.student_id = auth.uid()
    )
  );

grant select, insert on public.assignments to authenticated;
