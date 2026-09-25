import { supabase } from "../lib/supabase";

export type Preferences = {
  weekdayFinishTime: string;
  saturdayHours: number;
  sundayHours: number;
};

export type PreferencesInput = Preferences;

// For a student who has never saved study hours (no row yet). Matches
// the columns' own defaults. Saturday and Sunday are 2 hours each — not
// the prototype's 2 and 3 — per docs/decisions/
// 20260925-split-weekend-study-hours.md (S2).
export const DEFAULT_PREFERENCES: Preferences = {
  weekdayFinishTime: "21:00",
  saturdayHours: 2,
  sundayHours: 2,
};

const SELECT_COLUMNS = "weekday_finish_time, saturday_hours, sunday_hours";

function toPreferences(row: {
  weekday_finish_time: string;
  saturday_hours: number | string;
  sunday_hours: number | string;
}): Preferences {
  return {
    weekdayFinishTime: row.weekday_finish_time,
    // numeric columns: coerce, in case PostgREST returns them as strings.
    saturdayHours: Number(row.saturday_hours),
    sundayHours: Number(row.sunday_hours),
  };
}

// No row yet is a valid, expected state — not an error — so this
// returns the defaults rather than throwing.
export async function getPreferences(studentId: string): Promise<Preferences> {
  const { data, error } = await supabase
    .from("student_preferences")
    .select(SELECT_COLUMNS)
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return DEFAULT_PREFERENCES;

  return toPreferences(data);
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
      saturday_hours: input.saturdayHours,
      sunday_hours: input.sundayHours,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;

  return toPreferences(data);
}
