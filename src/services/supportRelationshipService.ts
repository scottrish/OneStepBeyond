import { generateInvitationToken, hashInvitationToken } from "../lib/invitationToken";
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

// docs/features/supporter-invitation-feature-spec-v0.1.md — the
// remaining functions below are that spec's Primary Flow, Student side
// (§7, §11) and invited-person side (§9/§10). Invitations expire after a
// fixed period — "the domain should not depend on a specific number of
// days" (§15) means this constant, not a value baked into RLS or an
// invariant elsewhere.
const INVITATION_EXPIRY_DAYS = 14;

export type RelationshipStatus = "pending" | "active" | "declined" | "expired" | "ended";

export type StudentRelationship = {
  id: string;
  invitedEmail: string;
  role: SupporterRole;
  status: RelationshipStatus;
  invitedAt: string;
};

// docs/features/supporter-invitation-feature-spec-v0.1.md §11 — "Student
// sees Pending and Active Supporters." Declined/Expired/Ended rows are
// fetched too rather than filtered here, since which statuses the UI
// chooses to surface is a display decision, not a data-access one.
export async function listRelationshipsForStudent(
  studentId: string,
): Promise<StudentRelationship[]> {
  const { data, error } = await supabase
    .from("support_relationships")
    .select("id, invited_email, role, status, invited_at")
    .eq("student_id", studentId)
    .order("invited_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    invitedEmail: row.invited_email,
    role: row.role as SupporterRole,
    status: row.status as RelationshipStatus,
    invitedAt: row.invited_at,
  }));
}

// docs/features/supporter-invitation-feature-spec-v0.1.md §7 Step 4 /
// Implementation Note — creates the Pending invitation and returns the
// raw token so the caller can build the link this increment displays
// directly, in place of sending it by email. The raw token is never
// itself sent to Postgres; only its hash is.
export async function createInvitation(params: {
  studentId: string;
  invitedEmail: string;
  role: SupporterRole;
}): Promise<{ relationshipId: string; rawToken: string }> {
  const rawToken = generateInvitationToken();
  const tokenHash = await hashInvitationToken(rawToken);
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("support_relationships")
    .insert({
      student_id: params.studentId,
      invited_email: params.invitedEmail,
      role: params.role,
      status: "pending",
      invited_by: "student",
      token_hash: tokenHash,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error) throw error;

  return { relationshipId: data.id, rawToken };
}

export type InvitationDetails = {
  id: string;
  invitedEmail: string;
  role: SupporterRole;
};

// docs/features/supporter-invitation-feature-spec-v0.1.md §9/§10 — the
// invited person's own lookup, after they've signed in. RLS (see
// 20260819050000_add_invitation_fields_to_support_relationships.sql)
// only ever returns a row here when the caller's own authenticated email
// matches invited_email and the invitation is still Pending and
// unexpired — a wrong-token, wrong-email, already-used, or expired link
// all look identical here (null), deliberately: nothing here should
// reveal *why* a link didn't work to whoever is holding it.
export async function findInvitationByToken(rawToken: string): Promise<InvitationDetails | null> {
  const tokenHash = await hashInvitationToken(rawToken);

  const { data, error } = await supabase
    .from("support_relationships")
    .select("id, invited_email, role")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return { id: data.id, invitedEmail: data.invited_email, role: data.role as SupporterRole };
}

export async function acceptInvitation(relationshipId: string, supporterId: string): Promise<void> {
  const { error } = await supabase
    .from("support_relationships")
    .update({ status: "active", supporter_id: supporterId, accepted_at: new Date().toISOString() })
    .eq("id", relationshipId);

  if (error) throw error;
}

export async function declineInvitation(relationshipId: string): Promise<void> {
  const { error } = await supabase
    .from("support_relationships")
    .update({ status: "declined" })
    .eq("id", relationshipId);

  if (error) throw error;
}
