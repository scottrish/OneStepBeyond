import { supabase } from "../lib/supabase";

export type Activity = {
  id: string;
  name: string;
  days: number[];
  startTime: string;
  finishTime: string;
  travelToMinutes: number;
  travelFromMinutes: number;
};

export type NewActivity = {
  name: string;
  days: number[];
  startTime: string;
  finishTime: string;
  travelToMinutes: number;
  travelFromMinutes: number;
};

const SELECT_COLUMNS =
  "id, name, days, start_time, finish_time, travel_to_minutes, travel_from_minutes";

function toActivity(row: {
  id: string;
  name: string;
  days: number[];
  start_time: string;
  finish_time: string;
  travel_to_minutes: number;
  travel_from_minutes: number;
}): Activity {
  return {
    id: row.id,
    name: row.name,
    days: row.days,
    startTime: row.start_time,
    finishTime: row.finish_time,
    travelToMinutes: row.travel_to_minutes,
    travelFromMinutes: row.travel_from_minutes,
  };
}

export async function listActivities(studentId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select(SELECT_COLUMNS)
    .eq("student_id", studentId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map(toActivity);
}

export async function createActivity(
  studentId: string,
  input: NewActivity,
): Promise<Activity> {
  const { data, error } = await supabase
    .from("activities")
    .insert({
      student_id: studentId,
      name: input.name,
      days: input.days,
      start_time: input.startTime,
      finish_time: input.finishTime,
      travel_to_minutes: input.travelToMinutes,
      travel_from_minutes: input.travelFromMinutes,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;

  return toActivity(data);
}

export async function updateActivityDays(
  activityId: string,
  days: number[],
): Promise<void> {
  const { error } = await supabase
    .from("activities")
    .update({ days })
    .eq("id", activityId);

  if (error) throw error;
}

export async function deleteActivity(activityId: string): Promise<void> {
  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("id", activityId);

  if (error) throw error;
}
