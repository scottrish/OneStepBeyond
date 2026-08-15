-- Course Setup (docs/features/course-setup.md)
-- A student's own list of courses. Single-owner table: RLS scopes every
-- row to the authenticated student (see docs/decisions/20260813-student-only-first-increment.md
-- for why student_id references auth.users directly rather than a
-- separate students/profiles table).

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  color_index integer not null,
  created_at timestamptz not null default now()
);

create index courses_student_id_idx on public.courses(student_id);

alter table public.courses enable row level security;

-- No delete policy: course deletion is deferred (see spec's Functional
-- Requirements) and RLS denies by default when no policy grants an action.

create policy "Students can view their own courses"
  on public.courses for select
  using (auth.uid() = student_id);

create policy "Students can create their own courses"
  on public.courses for insert
  with check (auth.uid() = student_id);

create policy "Students can rename their own courses"
  on public.courses for update
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);
