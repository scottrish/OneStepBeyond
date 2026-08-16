-- Daily Planning (docs/features/daily-planning.md)
-- Two tables for the Planning Session workflow:
--
-- work_sessions — a planned (eventually actual) block of time against a
-- Work Item on a specific day. student_id is denormalized here (also
-- derivable via work_item_id -> work_items.student_id), matching every
-- other table's RLS pattern so far (see work_items, decomposition_attempts).
-- status defaults to 'planned' and this increment never writes
-- 'in_progress' or 'done' — there is no Today Execution UI yet to advance
-- a session past "planned" — but the column exists now because
-- confirming a plan must distinguish not-yet-started sessions (replaced
-- wholesale on reconfirm) from in-progress/done ones (left alone), per
-- the feature spec's own functional requirements.
--
-- planning_sessions — an insert-only Domain Event log ("Plan Confirmed",
-- Domain-Model.md's Planning context): one row per confirmed plan,
-- recording how many items and minutes were planned. Never updated or
-- deleted, same reasoning as decomposition_attempts/reflections.

-- work_item_id cascades on delete, same as every other table referencing
-- work_items (student_id also cascades, matching that pattern). The
-- "revise Work Breakdown" flow (20260816033853_add_delete_to_work_items.sql)
-- deletes a Work Item's old rows once a new confirmed set has been
-- inserted; today that can only cascade-delete 'planned' work_sessions,
-- since nothing in this iteration ever writes 'in_progress'/'done' (no
-- Today Execution UI exists yet to advance a session past "planned") —
-- deleting a planned session for a step that no longer exists is
-- correct. Once a future increment starts recording actual time against
-- 'done' sessions, revisit whether a Work Breakdown revision should
-- still cascade-delete those, or should be blocked/relinked instead, so
-- real completed-work history isn't silently lost alongside a
-- steps edit.
create table public.work_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  work_item_id uuid not null references public.work_items(id) on delete cascade,
  date date not null,
  planned_minutes integer not null check (planned_minutes > 0),
  start_time time,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'done')),
  created_at timestamptz not null default now()
);

create index work_sessions_student_id_date_idx on public.work_sessions(student_id, date);
create index work_sessions_work_item_id_idx on public.work_sessions(work_item_id);

alter table public.work_sessions enable row level security;

create policy "Students can view their own work sessions"
  on public.work_sessions for select
  using (auth.uid() = student_id);

-- Mirrors work_items' own insert policy: WITH CHECK verifies both the
-- session's own student_id AND that work_item_id actually belongs to
-- that student, not just that the row exists (work_items is
-- select-granted to all authenticated users, so existence alone isn't
-- an ownership guarantee).
create policy "Students can create work sessions on their own work items"
  on public.work_sessions for insert
  with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.work_items w
      where w.id = work_item_id and w.student_id = auth.uid()
    )
  );

-- Update is not exercised by this increment (no Today Execution UI to
-- advance status yet) but is granted now on the same ownership terms as
-- insert, so a future status-advancing feature needs no migration.
-- WITH CHECK re-verifies work_item_id ownership too, not just
-- student_id — without it, a student could UPDATE a session they own to
-- point work_item_id at another student's work item, since USING only
-- checks the *old* row and student_id alone doesn't change.
create policy "Students can update their own work sessions"
  on public.work_sessions for update
  using (auth.uid() = student_id)
  with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.work_items w
      where w.id = work_item_id and w.student_id = auth.uid()
    )
  );

create policy "Students can delete their own work sessions"
  on public.work_sessions for delete
  using (auth.uid() = student_id);

grant select, insert, update, delete on public.work_sessions to authenticated;

create table public.planning_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  items_planned integer not null,
  minutes_planned integer not null,
  occurred_at timestamptz not null default now()
);

create index planning_sessions_student_id_date_idx on public.planning_sessions(student_id, date);

alter table public.planning_sessions enable row level security;

create policy "Students can view their own planning sessions"
  on public.planning_sessions for select
  using (auth.uid() = student_id);

create policy "Students can record their own planning sessions"
  on public.planning_sessions for insert
  with check (auth.uid() = student_id);

-- No update/delete: a Planning Session is a historical record of the
-- Plan Confirmed event, same reasoning as decomposition_attempts/reflections.
grant select, insert on public.planning_sessions to authenticated;
