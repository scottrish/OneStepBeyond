import { supabase } from "../lib/supabase";
import type { ExecutionStage, FrictionKind } from "../domain/executionCoaching";

// What a student reported getting in their way, the intervention offered,
// and what they did with it (execution-coaching-v0.1.md; see
// supabase/migrations/20260925150000_create_coaching_interactions.sql).

export type CoachingResponse = "selected" | "dismissed" | "replanned";

export type NewCoachingInteraction = {
  assignmentId: string;
  workItemId: string | null;
  workSessionId: string | null;
  stage: ExecutionStage;
  frictionKind: FrictionKind;
  interventionId: string;
};

export async function recordFriction(
  studentId: string,
  input: NewCoachingInteraction,
): Promise<string> {
  const { data, error } = await supabase
    .from("coaching_interactions")
    .insert({
      student_id: studentId,
      assignment_id: input.assignmentId,
      work_item_id: input.workItemId,
      work_session_id: input.workSessionId,
      stage: input.stage,
      friction_kind: input.frictionKind,
      intervention_id: input.interventionId,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

// How the student answered: an action chosen, the card set aside, or the
// plan changed — and, for "own first action", what they wrote.
export async function resolveInteraction(
  id: string,
  change: { response?: CoachingResponse; actionId?: string | null; note?: string | null },
): Promise<void> {
  const patch: Record<string, string | null> = {};
  if (change.response) {
    patch.response = change.response;
    patch.resolved_at = new Date().toISOString();
  }
  if (change.actionId !== undefined) patch.action_id = change.actionId;
  if (change.note !== undefined) patch.note = change.note;

  const { error } = await supabase.from("coaching_interactions").update(patch).eq("id", id);
  if (error) throw error;
}

/** The intervention ids of the student's most recent dismissals, newest first. */
export async function listRecentDismissals(studentId: string, limit: number): Promise<string[]> {
  const { data, error } = await supabase
    .from("coaching_interactions")
    .select("intervention_id")
    .eq("student_id", studentId)
    .eq("response", "dismissed")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => row.intervention_id);
}
