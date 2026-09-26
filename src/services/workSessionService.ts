import { supabase } from "../lib/supabase";
import { cachedRead } from "./offlineCache";

export type WorkSessionStatus = "planned" | "in_progress" | "done";

export type WorkSession = {
  id: string;
  workItemId: string;
  date: string;
  plannedMinutes: number;
  startTime: string | null;
  status: WorkSessionStatus;
  // When the session was started and marked done (execution-coaching-
  // v0.1.md, automatic elapsed time) — null if it never was, or it
  // predates recording. Optional so hand-built sessions stay valid.
  startedAt?: string | null;
  completedAt?: string | null;
  // plannedMinutes is the working estimate; this is what it was before the
  // student first revised it, or null if never revised (docs/decisions/
  // 20260925-execution-timing.md, E1).
  originalPlannedMinutes?: number | null;
};

export type NewWorkSession = {
  workItemId: string;
  date: string;
  plannedMinutes: number;
  startTime: string | null;
  // Carried when a session is moved to another day, so a revised
  // estimate keeps its history.
  originalPlannedMinutes?: number | null;
};

const SELECT_COLUMNS =
  "id, work_item_id, date, planned_minutes, start_time, status, started_at, completed_at, original_planned_minutes";

function toWorkSession(row: {
  id: string;
  work_item_id: string;
  date: string;
  planned_minutes: number;
  start_time: string | null;
  status: WorkSessionStatus;
  started_at?: string | null;
  completed_at?: string | null;
  original_planned_minutes?: number | null;
}): WorkSession {
  return {
    id: row.id,
    workItemId: row.work_item_id,
    date: row.date,
    plannedMinutes: row.planned_minutes,
    startTime: row.start_time,
    status: row.status,
    startedAt: row.started_at ?? null,
    completedAt: row.completed_at ?? null,
    originalPlannedMinutes: row.original_planned_minutes ?? null,
  };
}

// Kept on the device for offline use (PWA phase 2, 2b — offlineCache).
export async function listWorkSessionsForDate(
  studentId: string,
  date: string,
): Promise<WorkSession[]> {
  return cachedRead(studentId, `workSessions:${date}`, () => fetchListWorkSessionsForDate(studentId, date));
}

// For a single day's Day step (what's already planned) and for
// availableMinutes' "already planned" subtraction.
async function fetchListWorkSessionsForDate(
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

// Kept on the device for offline use (PWA phase 2, 2b — offlineCache).
export async function listWorkSessionsForStudent(studentId: string): Promise<WorkSession[]> {
  return cachedRead(studentId, "workSessions:all", () => fetchListWorkSessionsForStudent(studentId));
}

// For the Estimate step's estimationDrift coaching signal, which looks
// at the student's history of done sessions across every date, not just
// the day being planned.
async function fetchListWorkSessionsForStudent(studentId: string): Promise<WorkSession[]> {
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
        original_planned_minutes: session.originalPlannedMinutes ?? null,
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

// Start: "planned" -> "in_progress", recording when (Today Execution and
// Home's Next card). Returns the timestamp so the caller can keep it.
export async function startWorkSession(id: string): Promise<string> {
  const startedAt = new Date().toISOString();
  const { error } = await supabase
    .from("work_sessions")
    .update({ status: "in_progress", started_at: startedAt })
    .eq("id", id);

  if (error) throw error;
  return startedAt;
}

// Done: -> "done", recording when, so elapsed time is known without a
// timer (execution-coaching-v0.1.md). Returns the timestamp.
export async function completeWorkSession(id: string): Promise<string> {
  const completedAt = new Date().toISOString();
  const { error } = await supabase
    .from("work_sessions")
    .update({ status: "done", completed_at: completedAt })
    .eq("id", id);

  if (error) throw error;
  return completedAt;
}

// Today Execution's reschedule ("When would you rather do this?"): moves
// the session to a new day and time and back to "planned" — unlike Remove,
// it keeps the session (execution-coaching-v0.1.md).
export async function rescheduleWorkSession(
  id: string,
  date: string,
  startTime: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("work_sessions")
    .update({ date, start_time: startTime, status: "planned", started_at: null })
    .eq("id", id);

  if (error) throw error;
}

// A student-revised estimate ("Need more time"): plannedMinutes becomes the
// new working number and, the first time only, the value it replaces is
// kept as originalPlannedMinutes (E1). The caller computes both, in this
// codebase's simple read-then-write style (no Postgres functions yet).
export async function reviseWorkSessionEstimate(
  id: string,
  plannedMinutes: number,
  originalPlannedMinutes: number,
): Promise<void> {
  const { error } = await supabase
    .from("work_sessions")
    .update({ planned_minutes: plannedMinutes, original_planned_minutes: originalPlannedMinutes })
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
