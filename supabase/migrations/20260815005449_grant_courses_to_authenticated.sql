-- Fixes FINDING-IS-001 (docs/playwright/course-setup/iteration-01/findings.yaml):
-- RLS policies on public.courses were correctly scoped, but PostgREST
-- also requires an explicit GRANT — local Supabase's auto_expose_new_tables
-- default is off, so every request to courses returned 403 regardless of
-- RLS. Grant matches exactly the actions the existing policies cover.

grant select, insert, update on public.courses to authenticated;
