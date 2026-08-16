// Coaching signal for the Estimate step (docs/features/daily-planning.md):
// has the student historically underestimated similar work? Ported from
// ../OneStepBeyondPrototype/src/lib/domain/derive.ts.
//
// actualMinutes isn't a column work_sessions has yet (see the migration's
// header comment) — this iteration never sets it, since Today Execution
// (which would record actual time spent) doesn't exist. Kept as an
// optional field on this module's own local type, decoupled from the
// persisted WorkSession shape, so the function is faithful to the spec
// and ready to activate the moment that data starts flowing in, without
// this iteration adding a column nothing writes to yet.
export type SessionForDrift = {
  status: "planned" | "in_progress" | "done";
  plannedMinutes: number;
  actualMinutes?: number | null;
};

// Needs at least two completed, measured sessions before it says
// anything — a single data point isn't a pattern.
export function estimationDrift(sessions: SessionForDrift[]): number | null {
  const done = sessions.filter(
    (session) => session.status === "done" && session.actualMinutes != null,
  );
  if (done.length < 2) return null;

  const planned = done.reduce((sum, session) => sum + session.plannedMinutes, 0);
  if (planned === 0) return null;

  const actual = done.reduce((sum, session) => sum + (session.actualMinutes ?? 0), 0);
  return actual / planned;
}
