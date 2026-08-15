-- Activities (docs/features/activities.md)
-- A student's recurring non-academic commitments. Single-owner table,
-- same shape as courses/assignments. Unlike those two, this increment
-- includes delete — no other table references an activity by id yet, so
-- removing one is safe (contrast: courses/assignments both deferred
-- delete because Assignment.course_id and Work Item.assignment_id make
-- deletion a real cascading decision).
--
-- days is a fixed 0=Sun..6=Sat set — a smallint[] column rather than a
-- junction table, which would be unnecessary structure for seven fixed
-- values (CLAUDE.md's YAGNI guidance applied to schema, not just code).

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  -- cardinality(), not array_length(days, 1): array_length() returns NULL
  -- (not 0) for an empty array, which Postgres CHECK treats as satisfied
  -- — silently allowing days = '{}' through. cardinality() returns 0.
  days smallint[] not null check (
    cardinality(days) > 0
    and days <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
  ),
  start_time time not null,
  finish_time time not null check (finish_time > start_time),
  travel_minutes integer not null default 0 check (travel_minutes >= 0),
  created_at timestamptz not null default now()
);

create index activities_student_id_idx on public.activities(student_id);

alter table public.activities enable row level security;

create policy "Students can view their own activities"
  on public.activities for select
  using (auth.uid() = student_id);

create policy "Students can create their own activities"
  on public.activities for insert
  with check (auth.uid() = student_id);

create policy "Students can update their own activities"
  on public.activities for update
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

create policy "Students can delete their own activities"
  on public.activities for delete
  using (auth.uid() = student_id);

grant select, insert, update, delete on public.activities to authenticated;
