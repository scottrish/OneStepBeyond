import { supabase } from "../lib/supabase";

export type Assignment = {
  id: string;
  courseId: string;
  title: string;
  dueDate: string;
  effortMinutes: number;
  notes: string | null;
  completedAt: string | null;
};

export type NewAssignment = {
  courseId: string;
  title: string;
  dueDate: string;
  effortMinutes: number;
  notes: string;
};

export type AssignmentEdit = {
  title: string;
  dueDate: string;
  effortMinutes: number;
  notes: string;
};

const SELECT_COLUMNS =
  "id, course_id, title, due_date, effort_minutes, notes, completed_at";

function toAssignment(row: {
  id: string;
  course_id: string;
  title: string;
  due_date: string;
  effort_minutes: number;
  notes: string | null;
  completed_at: string | null;
}): Assignment {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    dueDate: row.due_date,
    effortMinutes: row.effort_minutes,
    notes: row.notes,
    completedAt: row.completed_at,
  };
}

export async function listAssignments(studentId: string): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from("assignments")
    .select(SELECT_COLUMNS)
    .eq("student_id", studentId)
    .order("due_date", { ascending: true });

  if (error) throw error;

  return (data ?? []).map(toAssignment);
}

export async function createAssignment(
  studentId: string,
  input: NewAssignment,
): Promise<Assignment> {
  const { data, error } = await supabase
    .from("assignments")
    .insert({
      student_id: studentId,
      course_id: input.courseId,
      title: input.title,
      due_date: input.dueDate,
      effort_minutes: input.effortMinutes,
      notes: input.notes.trim() === "" ? null : input.notes,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;

  return toAssignment(data);
}

export async function getAssignment(id: string): Promise<Assignment | null> {
  const { data, error } = await supabase
    .from("assignments")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return toAssignment(data);
}

export async function updateAssignment(
  id: string,
  patch: AssignmentEdit,
): Promise<void> {
  const { error } = await supabase
    .from("assignments")
    .update({
      title: patch.title,
      due_date: patch.dueDate,
      effort_minutes: patch.effortMinutes,
      notes: patch.notes.trim() === "" ? null : patch.notes,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteAssignment(id: string): Promise<void> {
  const { error } = await supabase.from("assignments").delete().eq("id", id);

  if (error) throw error;
}

// Marks the assignment itself complete. Completing its open Work Items is
// a separate call (workItemService.completeAllForAssignment) — kept in
// its own service since it's a different table; the hook layer
// orchestrates both for the single "Mark assignment complete" action.
export async function completeAssignment(id: string): Promise<void> {
  const { error } = await supabase
    .from("assignments")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
