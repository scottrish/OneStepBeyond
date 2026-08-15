import { supabase } from "../lib/supabase";

export type Assignment = {
  id: string;
  courseId: string;
  title: string;
  dueDate: string;
  effortMinutes: number;
  notes: string | null;
};

export type NewAssignment = {
  courseId: string;
  title: string;
  dueDate: string;
  effortMinutes: number;
  notes: string;
};

function toAssignment(row: {
  id: string;
  course_id: string;
  title: string;
  due_date: string;
  effort_minutes: number;
  notes: string | null;
}): Assignment {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    dueDate: row.due_date,
    effortMinutes: row.effort_minutes,
    notes: row.notes,
  };
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
    .select("id, course_id, title, due_date, effort_minutes, notes")
    .single();

  if (error) throw error;

  return toAssignment(data);
}

export async function getAssignment(id: string): Promise<Assignment | null> {
  const { data, error } = await supabase
    .from("assignments")
    .select("id, course_id, title, due_date, effort_minutes, notes")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return toAssignment(data);
}
