import { supabase } from "../lib/supabase";

export type WorkItem = {
  id: string;
  assignmentId: string;
  title: string;
  effortMinutes: number;
  completedAt: string | null;
  position: number;
};

export type NewWorkItem = {
  assignmentId: string;
  title: string;
  effortMinutes: number;
  position: number;
};

const SELECT_COLUMNS =
  "id, assignment_id, title, effort_minutes, completed_at, position";

function toWorkItem(row: {
  id: string;
  assignment_id: string;
  title: string;
  effort_minutes: number;
  completed_at: string | null;
  position: number;
}): WorkItem {
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    title: row.title,
    effortMinutes: row.effort_minutes,
    completedAt: row.completed_at,
    position: row.position,
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
    .order("position", { ascending: true });

  if (error) throw error;

  return (data ?? []).map(toWorkItem);
}

// For Assignment Detail, which only needs one assignment's steps.
export async function listWorkItems(assignmentId: string): Promise<WorkItem[]> {
  const { data, error } = await supabase
    .from("work_items")
    .select(SELECT_COLUMNS)
    .eq("assignment_id", assignmentId)
    .order("position", { ascending: true });

  if (error) throw error;

  return (data ?? []).map(toWorkItem);
}

// Bulk-inserts a confirmed Work Breakdown's items in one call, so the
// caller (workBreakdownService.confirmWorkBreakdown) can insert the new
// set before deleting whatever it's replacing — see
// docs/decisions/20260815-manual-work-breakdown-draft-state.md.
export async function createWorkItems(
  studentId: string,
  items: NewWorkItem[],
): Promise<WorkItem[]> {
  if (items.length === 0) return [];

  const { data, error } = await supabase
    .from("work_items")
    .insert(
      items.map((item) => ({
        student_id: studentId,
        assignment_id: item.assignmentId,
        title: item.title,
        effort_minutes: item.effortMinutes,
        position: item.position,
      })),
    )
    .select(SELECT_COLUMNS);

  if (error) throw error;

  return (data ?? []).map(toWorkItem);
}

export async function deleteWorkItems(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const { error } = await supabase.from("work_items").delete().in("id", ids);

  if (error) throw error;
}

export type WorkItemEdit = {
  title: string;
  effortMinutes: number;
};

// Inline editing of a single, already-confirmed Work Item directly from
// Assignment Detail (docs/features/assignment-detail-cta-hierarchy.md
// item 3b) — never called for a completed item, which stays immutable
// per docs/features/work-breakdown-revision-preserves-completed-items.md.
export async function updateWorkItem(id: string, patch: WorkItemEdit): Promise<void> {
  const { error } = await supabase
    .from("work_items")
    .update({ title: patch.title, effort_minutes: patch.effortMinutes })
    .eq("id", id);

  if (error) throw error;
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

// Today Execution's "Done" action (docs/features/today-execution.md)
// completes one Work Item's underlying step — this is what Assignment
// Detail's Steps checklist actually reads (completedAt), distinct from
// the Work Session's own status the Plan/Today screens track. Without
// this, a task marked Done in Today Execution shows as complete on Plan
// but never on Assignment Detail.
export async function completeWorkItem(id: string): Promise<void> {
  const { error } = await supabase
    .from("work_items")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
