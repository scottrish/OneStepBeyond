-- Student Preferences / "Study Hours" (docs/features/student-preferences.md)
-- Realizes Domain-Model.md's already-named Preferences entity (Student
-- context) and Availability's "configured study limits" input — neither
-- built until now.
--
-- One row per student, not a list like courses/activities/assignments —
-- the first single-owner settings table in this codebase. student_id is
-- the primary key itself (not a separate uuid + unique constraint), the
-- natural shape for a genuine 1:1 relationship, and it's what makes a
-- plain upsert (insert ... on conflict (student_id) do update) work
-- without a extra lookup.
--
-- Absence of a row is a valid, expected state (a student who has never
-- opened Study Hours) — src/services/preferencesService.ts's get()
-- returns today's hardcoded studyCapacity.ts defaults in that case, so
-- no backfill migration is needed for existing accounts.
--
-- weekday_finish_time only: weekday *start* is deliberately not
-- configurable (students aren't expected to use pre-school time for
-- work). weekend_hours is a plain budget, not a start/finish window —
-- students won't realistically hold to a fixed weekend time slot the
-- way a school day's "after school" anchor holds. Default 10 matches
-- today's hardcoded WEEKEND_WINDOW's span (10:00-20:00) exactly, so an
-- unconfigured account's capacity numbers don't change.

-- No updated_at: a plain `default now()` column only fires at insert
-- time and would silently freeze forever, since Postgres doesn't
-- re-apply column defaults on UPDATE and this table's upsert only sets
-- columns present in its payload. Nothing in this feature reads a
-- last-changed timestamp — add one deliberately (with a trigger that
-- actually keeps it current) if and when something does, rather than
-- carrying a column that quietly lies about its own name.
create table public.student_preferences (
  student_id uuid primary key references auth.users(id) on delete cascade,
  weekday_finish_time time not null default '21:00',
  weekend_hours numeric not null default 10 check (weekend_hours >= 0)
);

alter table public.student_preferences enable row level security;

create policy "Students can view their own preferences"
  on public.student_preferences for select
  using (auth.uid() = student_id);

create policy "Students can create their own preferences"
  on public.student_preferences for insert
  with check (auth.uid() = student_id);

create policy "Students can update their own preferences"
  on public.student_preferences for update
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

grant select, insert, update on public.student_preferences to authenticated;
