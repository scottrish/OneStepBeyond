import { supabase } from "../lib/supabase";

// Records a Planning Session — the "Plan Confirmed" Domain Event
// (docs/features/daily-planning.md). Insert-only: a Planning Session is
// a historical record of what was confirmed at the time, never mutated
// afterward (same reasoning as decomposition_attempts/reflections).
export async function recordPlanningSession(
  studentId: string,
  input: { date: string; itemsPlanned: number; minutesPlanned: number },
): Promise<void> {
  const { error } = await supabase.from("planning_sessions").insert({
    student_id: studentId,
    date: input.date,
    items_planned: input.itemsPlanned,
    minutes_planned: input.minutesPlanned,
  });

  if (error) throw error;
}
