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
