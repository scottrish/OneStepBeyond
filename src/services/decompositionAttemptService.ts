import { supabase } from "../lib/supabase";

// docs/features/manual-work-breakdown-reflection-v0.1.md §5 "Decomposition
// Attempt" — evidence for future coaching phases, recorded but not acted
// on this increment. ScaffoldIntensity/assistanceRequested are always
// 'None'/false here since no coaching exists yet.
export type NewDecompositionAttempt = {
  assignmentId: string;
  initialWorkItems: string[];
  resultingWorkItems: string[];
  revisionCount: number;
  outcome: string;
};

export async function recordDecompositionAttempt(
  studentId: string,
  input: NewDecompositionAttempt,
): Promise<void> {
  const { error } = await supabase.from("decomposition_attempts").insert({
    student_id: studentId,
    assignment_id: input.assignmentId,
    initial_work_items: input.initialWorkItems,
    resulting_work_items: input.resultingWorkItems,
    revision_count: input.revisionCount,
    outcome: input.outcome,
  });

  if (error) throw error;
}
