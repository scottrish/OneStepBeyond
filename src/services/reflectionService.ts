import { supabase } from "../lib/supabase";

// docs/features/manual-work-breakdown-reflection-v0.1.md §10-12 — the
// student's own account of whether their Work Breakdown worked, stored
// distinct from objective Behavior Observation (Domain Invariant 11).
export type NewReflection = {
  assignmentId: string;
  trigger: string;
  structuredResponse: string;
  freeText: string | null;
  proposedAdjustment: string | null;
};

// docs/features/coach-parent-dashboard-feature-spec-v0.1.md §10 — read
// shape for the dashboard's Reflections screen.
export type Reflection = {
  id: string;
  assignmentId: string;
  trigger: string;
  structuredResponse: string;
  freeText: string | null;
  proposedAdjustment: string | null;
  scaffoldIntensity: string;
  occurredAt: string;
};

const SELECT_COLUMNS =
  "id, assignment_id, trigger, structured_response, free_text, proposed_adjustment, scaffold_intensity, occurred_at";

function toReflection(row: {
  id: string;
  assignment_id: string;
  trigger: string;
  structured_response: string;
  free_text: string | null;
  proposed_adjustment: string | null;
  scaffold_intensity: string;
  occurred_at: string;
}): Reflection {
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    trigger: row.trigger,
    structuredResponse: row.structured_response,
    freeText: row.free_text,
    proposedAdjustment: row.proposed_adjustment,
    scaffoldIntensity: row.scaffold_intensity,
    occurredAt: row.occurred_at,
  };
}

export async function recordReflection(
  studentId: string,
  input: NewReflection,
): Promise<void> {
  const { error } = await supabase.from("reflections").insert({
    student_id: studentId,
    assignment_id: input.assignmentId,
    trigger: input.trigger,
    structured_response: input.structuredResponse,
    free_text: input.freeText,
    proposed_adjustment: input.proposedAdjustment,
  });

  if (error) throw error;
}

// docs/features/coach-parent-dashboard-feature-spec-v0.1.md — read-only
// projection for the dashboard. Same RLS/auth-reuse reasoning as
// decompositionAttemptService.listForStudent.
export async function listForStudent(studentId: string): Promise<Reflection[]> {
  const { data, error } = await supabase
    .from("reflections")
    .select(SELECT_COLUMNS)
    .eq("student_id", studentId)
    .order("occurred_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map(toReflection);
}
