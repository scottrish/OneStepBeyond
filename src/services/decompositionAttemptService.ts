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

// docs/features/coach-parent-dashboard-feature-spec-v0.1.md §8/§23 —
// read shape for the dashboard's Decomposition Attempt history. Field
// names match the spec's own vocabulary (assistanceRequested,
// highestScaffoldIntensity, ...) even though every attempt recorded this
// increment has the same constant values.
export type DecompositionAttempt = {
  id: string;
  assignmentId: string;
  initialWorkItems: string[];
  resultingWorkItems: string[];
  revisionCount: number;
  assistanceRequested: boolean;
  initialScaffoldIntensity: string;
  highestScaffoldIntensity: string;
  scaffoldsProvided: string[];
  outcome: string;
  occurredAt: string;
};

const SELECT_COLUMNS =
  "id, assignment_id, initial_work_items, resulting_work_items, revision_count, assistance_requested, initial_scaffold_intensity, highest_scaffold_intensity, scaffolds_provided, outcome, occurred_at";

function toDecompositionAttempt(row: {
  id: string;
  assignment_id: string;
  initial_work_items: string[];
  resulting_work_items: string[];
  revision_count: number;
  assistance_requested: boolean;
  initial_scaffold_intensity: string;
  highest_scaffold_intensity: string;
  scaffolds_provided: string[];
  outcome: string;
  occurred_at: string;
}): DecompositionAttempt {
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    initialWorkItems: row.initial_work_items,
    resultingWorkItems: row.resulting_work_items,
    revisionCount: row.revision_count,
    assistanceRequested: row.assistance_requested,
    initialScaffoldIntensity: row.initial_scaffold_intensity,
    highestScaffoldIntensity: row.highest_scaffold_intensity,
    scaffoldsProvided: row.scaffolds_provided,
    outcome: row.outcome,
    occurredAt: row.occurred_at,
  };
}

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

// docs/features/coach-parent-dashboard-feature-spec-v0.1.md — read-only
// projection for the dashboard. Relies on the same RLS scoping every
// other list function does (auth.uid() = student_id); the dashboard
// reuses the student's own session, so no new access model is needed —
// see docs/decisions/20260816-dashboard-reuses-student-auth.md.
export async function listForStudent(
  studentId: string,
): Promise<DecompositionAttempt[]> {
  const { data, error } = await supabase
    .from("decomposition_attempts")
    .select(SELECT_COLUMNS)
    .eq("student_id", studentId)
    .order("occurred_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map(toDecompositionAttempt);
}
