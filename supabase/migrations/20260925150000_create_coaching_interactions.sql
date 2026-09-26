-- Coaching interactions (docs/features/execution-coaching-v0.1.md, roadmap
-- Phase 7 step 12b; docs/decisions/20260925-execution-timing.md).
--
-- One row each time a student says what's getting in the way of a work
-- session ("What's getting in the way?") — the Domain Model's Blocker
-- (friction_kind) — together with the one Intervention offered and what
-- the student did with it: chose one of its actions (selected), set it
-- aside ("Not helpful right now", or closing the sheet: dismissed), or
-- changed the plan (replanned). Recent dismissals steer the next offer
-- away from a strategy the student has already rejected twice.
--
-- work_session_id / work_item_id are "set null" on delete: sessions are
-- removed and moved routinely (Remove, Move to another day, a completed
-- step's other time), and what the student reported is still true.
-- assignment_id cascades, like everything else under an assignment, so
-- deleting an assignment or course (20260925130000) removes these too.
--
-- Student-only access for now. The coach/parent dashboard's friction
-- panel will add its own read policy when it's built (YAGNI).

create table public.coaching_interactions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  work_item_id uuid references public.work_items(id) on delete set null,
  work_session_id uuid references public.work_sessions(id) on delete set null,
  stage text not null check (stage in ('before_start', 'in_progress')),
  friction_kind text not null check (
    friction_kind in (
      'cant_start', 'unclear_task', 'too_big', 'distracted',
      'dont_know_next', 'taking_longer', 'other'
    )
  ),
  intervention_id text not null,
  response text check (response in ('selected', 'dismissed', 'replanned')),
  action_id text,
  note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index coaching_interactions_student_created_idx
  on public.coaching_interactions(student_id, created_at desc);
create index coaching_interactions_assignment_id_idx
  on public.coaching_interactions(assignment_id);

alter table public.coaching_interactions enable row level security;

create policy "Students can view their own coaching interactions"
  on public.coaching_interactions for select
  using (auth.uid() = student_id);

-- Like work_sessions: the assignment — and the step and session, when
-- set — must be the student's own too, not just the row's student_id
-- (those tables are readable more widely, so existence isn't ownership).
create policy "Students can record their own coaching interactions"
  on public.coaching_interactions for insert
  with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.assignments a
      where a.id = assignment_id and a.student_id = auth.uid()
    )
    and (
      work_item_id is null
      or exists (
        select 1 from public.work_items w
        where w.id = work_item_id and w.student_id = auth.uid()
      )
    )
    and (
      work_session_id is null
      or exists (
        select 1 from public.work_sessions s
        where s.id = work_session_id and s.student_id = auth.uid()
      )
    )
  );

create policy "Students can update their own coaching interactions"
  on public.coaching_interactions for update
  using (auth.uid() = student_id)
  with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.assignments a
      where a.id = assignment_id and a.student_id = auth.uid()
    )
    and (
      work_item_id is null
      or exists (
        select 1 from public.work_items w
        where w.id = work_item_id and w.student_id = auth.uid()
      )
    )
    and (
      work_session_id is null
      or exists (
        select 1 from public.work_sessions s
        where s.id = work_session_id and s.student_id = auth.uid()
      )
    )
  );

grant select, insert, update on public.coaching_interactions to authenticated;
