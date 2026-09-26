-- Work session timing and revised estimates
-- (docs/features/execution-coaching-v0.1.md, "Automatic elapsed-time
-- capture" and "Revised estimate, shown honestly"; roadmap Phase 7 step
-- 12a; docs/decisions/20260925-execution-timing.md).
--
-- started_at / completed_at: set when a session is started and marked
-- done, so the time actually spent (completed_at - started_at) is known
-- without a timer or asking the student. Either can be null: sessions
-- from before this migration, or finished without being started.
--
-- original_planned_minutes: planned_minutes stays the working estimate
-- every reader already uses (capacity, re-chaining, Plan, Home, risk).
-- The first time a student revises it ("Need more time"), the value it
-- had is kept here, so "first planned 30m" can be shown honestly instead
-- of overwriting history (decision E1). Null until then.
--
-- No RLS change: the existing update policy on work_sessions checks
-- ownership only and covers every column; the grants are table-level.

alter table public.work_sessions
  add column started_at timestamptz,
  add column completed_at timestamptz,
  add column original_planned_minutes integer check (original_planned_minutes > 0);
