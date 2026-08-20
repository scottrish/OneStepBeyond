import { supabase } from "../lib/supabase";

// docs/features/supporter-role-based-access-feature-spec-v0.1.md §4/§8 —
// read-only projection of a Supporter's own Active relationships, the
// input to dashboard role resolution (§7.2). Only Active relationships
// are fetched: Pending/Declined/Expired/Ended grant no access and have
// nothing to contribute to "which Students can I currently support."
export type SupporterRole = "parent_guardian" | "coach";

export type ActiveSupportRelationship = {
  id: string;
  studentId: string;
  role: SupporterRole;
};

export async function listActiveRelationshipsForSupporter(
  supporterId: string,
): Promise<ActiveSupportRelationship[]> {
  const { data, error } = await supabase
    .from("support_relationships")
    .select("id, student_id, role")
    .eq("supporter_id", supporterId)
    .eq("status", "active");

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    studentId: row.student_id,
    role: row.role as SupporterRole,
  }));
}
