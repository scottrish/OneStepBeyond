-- Manual Work Breakdown (docs/features/manual-work-breakdown-reflection-v0.1.md)
-- Confirming a revised Work Breakdown replaces the assignment's Work
-- Items (insert the new confirmed set, then delete the ones that existed
-- before this edit session — see
-- docs/decisions/20260815-manual-work-breakdown-draft-state.md for why
-- insert happens before delete). work_items had no delete policy yet
-- since assignment-management.md's "Add another step" never needed one.

create policy "Students can delete their own work items"
  on public.work_items for delete
  using (auth.uid() = student_id);

grant delete on public.work_items to authenticated;
