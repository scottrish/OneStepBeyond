-- Manual Work Breakdown (docs/features/manual-work-breakdown-reflection-v0.1.md)
-- Work Items need a student-chosen order ("reorder Work Items", spec §4
-- Step 1) — until now, work_items had no ordering column and was always
-- listed by created_at, which can't represent a reorder.
--
-- Backfill existing rows to a stable order (created_at ascending, per
-- assignment) so students who already have Work Items from
-- assignment-management.md's "Add another step" don't see them jump
-- around once position becomes the real sort key.

alter table public.work_items
  add column position integer not null default 0;

with ordered as (
  select
    id,
    row_number() over (partition by assignment_id order by created_at, id) - 1 as new_position
  from public.work_items
)
update public.work_items w
set position = ordered.new_position
from ordered
where w.id = ordered.id;
