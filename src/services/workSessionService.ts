import { supabase } from "../lib/supabase";

export type WorkSessionStatus = "planned" | "in_progress" | "done";

export type WorkSession = {
  id: string;
  workItemId: string;
  date: string;
  plannedMinutes: number;
  startTime: string | null;
  status: WorkSessionStatus;
};

export type NewWorkSession = {
  workItemId: string;
  date: string;
  plannedMinutes: number;
  startTime: string | null;
};

const SELECT_COLUMNS = "id, work_item_id, date, planned_minutes, start_time, status";

function toWorkSession(row: {
  id: string;
  work_item_id: string;
  date: string;
  planned_minutes: number;
  start_time: string | null;
  status: WorkSessionStatus;
}): WorkSession {
  return {
    id: row.id,
    workItemId: row.work_item_id,
    date: row.date,
    plannedMinutes: row.planned_minutes,
    startTime: row.start_time,
    status: row.status,
  };
}

// For a single day's Day step (what's already planned) and for
// availableMinutes' "already planned" subtraction.
export async function listWorkSessionsForDate(
  studentId: string,
  date: string,
): Promise<WorkSession[]> {
  const { data, error } = await supabase
    .from("work_sessions")
    .select(SELECT_COLUMNS)
    .eq("student_id", studentId)
    .eq("date", date);

  if (error) throw error;

  return (data ?? []).map(toWorkSession);
}

// For the Estimate step's estimationDrift coaching signal, which looks
// at the student's history of done sessions across every date, not just
// the day being planned.
export async function listWorkSessionsForStudent(studentId: string): Promise<WorkSession[]> {
  const { data, error } = await supabase
    .from("work_sessions")
    .select(SELECT_COLUMNS)
    .eq("student_id", studentId);

  if (error) throw error;

  return (data ?? []).map(toWorkSession);
}

// Bulk-inserts a confirmed plan's sessions in one call, so the caller
// (useDailyPlanning's confirmPlan) can insert the new set before
// deleting whatever it's replacing — same insert-before-delete ordering
// as workBreakdownService.confirmWorkBreakdown, so a failure partway
// through never leaves a day with no plan at all.
export async function createWorkSessions(
  studentId: string,
  sessions: NewWorkSession[],
): Promise<WorkSession[]> {
  if (sessions.length === 0) return [];

  const { data, error } = await supabase
    .from("work_sessions")
    .insert(
      sessions.map((session) => ({
        student_id: studentId,
        work_item_id: session.workItemId,
        date: session.date,
        planned_minutes: session.plannedMinutes,
        start_time: session.startTime,
      })),
    )
    .select(SELECT_COLUMNS);

  if (error) throw error;

  return (data ?? []).map(toWorkSession);
}

// Confirming a plan replaces that date's *not-yet-started* sessions only
// — in-progress/done sessions are left alone
// (docs/features/daily-planning.md's functional requirements).
export async function deletePlannedSessionsForDate(
  studentId: string,
  date: string,
): Promise<void> {
  const { error } = await supabase
    .from("work_sessions")
    .delete()
    .eq("student_id", studentId)
    .eq("date", date)
    .eq("status", "planned");

  if (error) throw error;
}

// The Day step's "remove" affordance for a single already-planned item.
export async function deleteWorkSession(id: string): Promise<void> {
  const { error } = await supabase.from("work_sessions").delete().eq("id", id);

  if (error) throw error;
}
