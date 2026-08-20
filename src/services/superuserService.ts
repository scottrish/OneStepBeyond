import { supabase } from "../lib/supabase";

// docs/features/supporter-role-based-access-feature-spec-v0.1.md §7.3 —
// checks the current user's own superuser status only (that's all
// public.superusers' RLS policy grants — see its migration). A row here
// is never created through application code; this is a pure read of
// whatever direct database access has already provisioned.
export async function isSuperuser(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("superusers")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  return data !== null;
}

// A superuser has no Support Relationship to lean on for "which Student
// am I looking at" (§7.2 is Supporter-only), and there's no separate
// Student registry table in this codebase (every table denormalizes its
// own student_id — see 20260815003757_create_courses_table.sql's own
// comment on why). Courses is used as the discovery source since it's
// the first thing a real Student's data ever has, and a superuser's own
// RLS policy already grants full read access to it — no new policy is
// needed for this query to work.
export async function listKnownStudentIds(): Promise<string[]> {
  const { data, error } = await supabase.from("courses").select("student_id");

  if (error) throw error;

  return Array.from(new Set((data ?? []).map((row) => row.student_id as string)));
}
