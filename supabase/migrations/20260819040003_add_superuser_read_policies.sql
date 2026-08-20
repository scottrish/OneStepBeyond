-- Real Role-Based Access (docs/features/supporter-role-based-access-feature-spec-v0.1.md
-- §7.3) — a superuser can read any Student's data, independent of any
-- Support Relationship. This is what Diagnostic Mode now checks, in
-- place of the removed client-side mode toggle. Additive next to the
-- owner and Supporter policies (20260819040002_add_supporter_read_policies.sql);
-- read-only, same as that migration, and scoped to the same five tables
-- for the same reason (see its own comment).

create policy "Superusers can view any student's courses"
  on public.courses for select
  using (exists (select 1 from public.superusers su where su.user_id = auth.uid()));

create policy "Superusers can view any student's assignments"
  on public.assignments for select
  using (exists (select 1 from public.superusers su where su.user_id = auth.uid()));

create policy "Superusers can view any student's work items"
  on public.work_items for select
  using (exists (select 1 from public.superusers su where su.user_id = auth.uid()));

create policy "Superusers can view any student's decomposition attempts"
  on public.decomposition_attempts for select
  using (exists (select 1 from public.superusers su where su.user_id = auth.uid()));

create policy "Superusers can view any student's reflections"
  on public.reflections for select
  using (exists (select 1 from public.superusers su where su.user_id = auth.uid()));
