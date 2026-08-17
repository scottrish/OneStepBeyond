import { supabase } from "../lib/supabase";

export type Preferences = {
  weekdayFinishTime: string;
  weekendHours: number;
};

export type PreferencesInput = {
  weekdayFinishTime: string;
  weekendHours: number;
};

// Matches src/domain/studyCapacity.ts's current hardcoded
// WEEKDAY_WINDOW.finish / WEEKEND_WINDOW span exactly — a student who
// has never opened Study Hours sees the same capacity numbers as before
// this feature existed (docs/features/student-preferences.md's own
// "no regression" acceptance criterion).
export const DEFAULT_PREFERENCES: Preferences = {
  weekdayFinishTime: "21:00",
  weekendHours: 10,
};

// No row yet is a valid, expected state — not an error — so this
// returns the defaults rather than throwing, the same way
// studyCapacity.ts's constants apply to every student today.
export async function getPreferences(studentId: string): Promise<Preferences> {
  const { data, error } = await supabase
    .from("student_preferences")
    .select("weekday_finish_time, weekend_hours")
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return DEFAULT_PREFERENCES;

  return {
    weekdayFinishTime: data.weekday_finish_time,
    weekendHours: data.weekend_hours,
  };
}

// student_id is the table's own primary key, so this targets it as the
// upsert's conflict target with no explicit onConflict needed — first
// save creates the row, every save after that updates it in place.
export async function upsertPreferences(
  studentId: string,
  input: PreferencesInput,
): Promise<Preferences> {
  const { data, error } = await supabase
    .from("student_preferences")
    .upsert({
      student_id: studentId,
      weekday_finish_time: input.weekdayFinishTime,
      weekend_hours: input.weekendHours,
    })
    .select("weekday_finish_time, weekend_hours")
    .single();

  if (error) throw error;

  return {
    weekdayFinishTime: data.weekday_finish_time,
    weekendHours: data.weekend_hours,
  };
}
