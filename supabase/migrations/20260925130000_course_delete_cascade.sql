-- Course deletion, with everything under it
-- (docs/features/course-management-v2-proposal.md §2;
-- docs/decisions/20260925-course-colour-and-delete.md).
--
-- 20260815003757_create_courses_table.sql deliberately had no delete
-- policy ("course deletion is deferred"), and assignments.course_id had
-- no on-delete action, so a course with assignments couldn't be deleted
-- at all. Both change here.
--
-- Deleting a course now deletes its assignments in the same statement,
-- and everything under them already cascades from assignments:
--   work_items (on delete cascade)
--     -> work_sessions (on delete cascade)
--   decomposition_attempts (on delete cascade)
--   reflections (on delete cascade)
-- planning_sessions has no link to assignments (one row per confirmed
-- plan: date, item count, minutes), so it's untouched.
--
-- The student is warned first, in the app: every assignment goes,
-- whether not yet planned, planned or completed. There is no undo
-- (20260817-remove-undo-delete.md).

alter table public.assignments
  drop constraint assignments_course_id_fkey,
  add constraint assignments_course_id_fkey
    foreign key (course_id) references public.courses(id) on delete cascade;

create policy "Students can delete their own courses"
  on public.courses for delete
  using (auth.uid() = student_id);

grant delete on public.courses to authenticated;
