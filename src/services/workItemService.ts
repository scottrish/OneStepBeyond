import { supabase } from "../lib/supabase";

export type WorkItem = {
  id: string;
  assignmentId: string;
  title: string;
  effortMinutes: number;
  completedAt: string | null;
};

export type NewWorkItem = {
  assignmentId: string;
  title: string;
  effortMinutes: number;
};

const SELECT_COLUMNS = "id, assignment_id, title, effort_minutes, completed_at";

function toWorkItem(row: {
  id: string;
  assignment_id: string;
  title: string;
  effort_minutes: number;
  completed_at: string | null;
}): WorkItem {
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    title: row.title,
    effortMinutes: row.effort_minutes,
    completedAt: row.completed_at,
  };
}

// For the Assignments list, which needs every assignment's work items at
// once (remaining-effort text, structured/progress-bar check) — one
// indexed query grouped client-side, rather than one query per assignment.
export async function listWorkItemsForStudent(
  studentId: string,
): Promise<WorkItem[]> {
  const { data, error } = await supabase
    .from("work_items")
    .select(SELECT_COLUMNS)
    .eq("student_id", studentId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map(toWorkItem);
}

// For Assignment Detail, which only needs one assignment's steps.
export async function listWorkItems(assignmentId: string): Promise<WorkItem[]> {
  const { data, error } = await supabase
    .from("work_items")
    .select(SELECT_COLUMNS)
    .eq("assignment_id", assignmentId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map(toWorkItem);
}

export async function createWorkItem(
  studentId: string,
  input: NewWorkItem,
): Promise<WorkItem> {
  const { data, error } = await supabase
    .from("work_items")
    .insert({
      student_id: studentId,
      assignment_id: input.assignmentId,
      title: input.title,
      effort_minutes: input.effortMinutes,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;

  return toWorkItem(data);
}

// "Mark assignment complete" completes the assignment and all its
// remaining open steps in one action (docs/features/assignment-management.md).
export async function completeAllForAssignment(
  assignmentId: string,
): Promise<void> {
  const { error } = await supabase
    .from("work_items")
    .update({ completed_at: new Date().toISOString() })
    .eq("assignment_id", assignmentId)
    .is("completed_at", null);

  if (error) throw error;
}
