-- Real Role-Based Access (docs/features/supporter-role-based-access-feature-spec-v0.1.md
-- §8) — a Supporter can read a Student's data if and only if an Active
-- Support Relationship names them as that Student's supporter. Additive
-- next to each table's existing owner policy (Postgres OR's multiple
-- permissive policies for the same command, so nothing existing
-- changes), and read-only: no insert/update/delete policy is added here
-- or anywhere else for Supporters, on any table — a Supporter never
-- becomes owner of an Assignment, Work Breakdown, Plan, or Reflection
-- (Domain-Model.md Invariant #4; supporter-invitation-feature-spec-v0.1.md §5).
--
-- Scoped to the five tables docs/dashboard/hooks/useDashboardData.ts
-- actually queries today (courses, assignments, work_items,
-- decomposition_attempts, reflections) rather than every Student-scoped
-- table in the schema — activities/work_sessions/planning_sessions/
-- student_preferences aren't read by any Supporter-facing screen yet, so
-- granting access to them now would be speculative (Domain-Model.md Core
-- Principle #12: "Do not add complexity without demonstrated value").
-- Add their own policy, in their own small migration, whenever a
-- dashboard screen actually needs one.

create policy "Supporters can view their students' courses"
  on public.courses for select
  using (
    exists (
      select 1 from public.support_relationships sr
      where sr.student_id = courses.student_id
        and sr.supporter_id = auth.uid()
        and sr.status = 'active'
    )
  );

create policy "Supporters can view their students' assignments"
  on public.assignments for select
  using (
    exists (
      select 1 from public.support_relationships sr
      where sr.student_id = assignments.student_id
        and sr.supporter_id = auth.uid()
        and sr.status = 'active'
    )
  );

create policy "Supporters can view their students' work items"
  on public.work_items for select
  using (
    exists (
      select 1 from public.support_relationships sr
      where sr.student_id = work_items.student_id
        and sr.supporter_id = auth.uid()
        and sr.status = 'active'
    )
  );

create policy "Supporters can view their students' decomposition attempts"
  on public.decomposition_attempts for select
  using (
    exists (
      select 1 from public.support_relationships sr
      where sr.student_id = decomposition_attempts.student_id
        and sr.supporter_id = auth.uid()
        and sr.status = 'active'
    )
  );

create policy "Supporters can view their students' reflections"
  on public.reflections for select
  using (
    exists (
      select 1 from public.support_relationships sr
      where sr.student_id = reflections.student_id
        and sr.supporter_id = auth.uid()
        and sr.status = 'active'
    )
  );
