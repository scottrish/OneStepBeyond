import { supabase } from "../lib/supabase";
import { cachedRead, peekRead } from "./offlineCache";

export type Course = {
  id: string;
  name: string;
  colorIndex: number;
};

// The in-memory copy, for an instant screen (instant-screen-data-v0.1.md).
export function peekCourses(studentId: string): Course[] | undefined {
  return peekRead(studentId, "courses");
}

// Kept on the device for offline use (PWA phase 2, 2b — offlineCache).
export async function listCourses(studentId: string): Promise<Course[]> {
  return cachedRead(studentId, "courses", () => fetchListCourses(studentId));
}

async function fetchListCourses(studentId: string): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("id, name, color_index")
    .eq("student_id", studentId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    colorIndex: row.color_index,
  }));
}

export async function createCourse(
  studentId: string,
  name: string,
  colorIndex: number,
): Promise<Course> {
  const { data, error } = await supabase
    .from("courses")
    .insert({ student_id: studentId, name, color_index: colorIndex })
    .select("id, name, color_index")
    .single();

  if (error) throw error;

  return { id: data.id, name: data.name, colorIndex: data.color_index };
}

// Name and colour together — the Courses screen's edit saves both at
// once (docs/decisions/20260925-course-colour-and-delete.md, C2).
export async function updateCourse(
  courseId: string,
  changes: { name: string; colorIndex: number },
): Promise<void> {
  const { error } = await supabase
    .from("courses")
    .update({ name: changes.name, color_index: changes.colorIndex })
    .eq("id", courseId);

  if (error) throw error;
}

// Deletes the course and, through the database's cascade, every
// assignment in it and everything under those (steps, planned sessions,
// reflections, decomposition attempts) — see
// supabase/migrations/20260925130000_course_delete_cascade.sql. The
// student has already been warned.
export async function deleteCourse(courseId: string): Promise<void> {
  const { error } = await supabase.from("courses").delete().eq("id", courseId);

  if (error) throw error;
}
