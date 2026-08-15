-- Assignment Management (docs/features/assignment-management.md)
-- The original assignments migration granted only select+insert,
-- deliberately, with a comment flagging this as the moment to revisit
-- once edit/delete UI existed. This is that moment.

-- WITH CHECK re-verifies course ownership on update, not just student_id
-- — same reasoning as the original insert policy: course_id existing
-- isn't proof of ownership, since courses is select-granted to every
-- authenticated user. The UI doesn't currently let a student change an
-- assignment's course, but the policy shouldn't rely on that.
create policy "Students can update their own assignments"
  on public.assignments for update
  using (auth.uid() = student_id)
  with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.courses c
      where c.id = course_id and c.student_id = auth.uid()
    )
  );

create policy "Students can delete their own assignments"
  on public.assignments for delete
  using (auth.uid() = student_id);

grant update, delete on public.assignments to authenticated;
