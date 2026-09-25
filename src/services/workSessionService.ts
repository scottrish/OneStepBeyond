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

// The Day step's "remove" affordance for a single already-planned item,
// and Today Execution's "I'm stuck" -> "Move to tomorrow" defer action
// (docs/features/today-execution.md: deferred sessions "drop out of
// today's list entirely... not cancelled, just moved" — the student
// replans them explicitly later, so this is the same operation as
// Remove, not a distinct "deferred" status).
export async function deleteWorkSession(id: string): Promise<void> {
  const { error } = await supabase.from("work_sessions").delete().eq("id", id);

  if (error) throw error;
}

// Today Execution's Start ("planned" -> "in_progress") and Done
// ("in_progress" -> "done") transitions.
export async function updateWorkSessionStatus(
  id: string,
  status: WorkSessionStatus,
): Promise<void> {
  const { error } = await supabase.from("work_sessions").update({ status }).eq("id", id);

  if (error) throw error;
}

// Today Execution's "Need more time" action — the caller computes the
// new total (current plannedMinutes + 10) rather than this function
// incrementing server-side, consistent with this codebase's simple
// read-then-write style elsewhere (no Postgres functions/RPCs yet).
export async function updateWorkSessionPlannedMinutes(
  id: string,
  plannedMinutes: number,
): Promise<void> {
  const { error } = await supabase
    .from("work_sessions")
    .update({ planned_minutes: plannedMinutes })
    .eq("id", id);

  if (error) throw error;
}

export type StartTimeUpdate = {
  id: string;
  startTime: string;
};

// A reorder's re-chained times (or a single retime) for one day's
// planned sessions. One update per row, sent together: without a
// Postgres function there's no atomic multi-row update, and an upsert
// would have to resend whole rows — risking a stale status overwriting
// a session Today Execution started meanwhile. Each update is guarded
// to still-planned rows for the same reason. A partial failure leaves
// some times stale but loses nothing; callers reload on error.
// docs/decisions/20260925-session-reorder-and-drag.md.
export async function updateWorkSessionStartTimes(updates: StartTimeUpdate[]): Promise<void> {
  const results = await Promise.all(
    updates.map(({ id, startTime }) =>
      supabase
        .from("work_sessions")
        .update({ start_time: startTime })
        .eq("id", id)
        .eq("status", "planned"),
    ),
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}
