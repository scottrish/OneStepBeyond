import { supabase } from "../lib/supabase";

export type Course = {
  id: string;
  name: string;
  colorIndex: number;
};

export async function listCourses(studentId: string): Promise<Course[]> {
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

export async function renameCourse(
  courseId: string,
  name: string,
): Promise<void> {
  const { error } = await supabase
    .from("courses")
    .update({ name })
    .eq("id", courseId);

  if (error) throw error;
}
