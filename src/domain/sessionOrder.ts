import type { WorkSession } from "../services/workSessionService";

// Sessions without an assigned start time (e.g. moved from another day
// without picking a new time — see daily-planning.i04.md FR-3, or created
// without a Schedule step at all) sort after every timed session, rather
// than jumping the queue. Shared between Today Execution's current-task
// ordering and Home's own "Next" card (home-dashboard.md), which need
// the exact same rule.
export function sortByStartTime(sessions: WorkSession[]): WorkSession[] {
  return [...sessions].sort((a, b) => (a.startTime ?? "24:00").localeCompare(b.startTime ?? "24:00"));
}

// Applies saved start-time changes (a reorder's re-chain, or a single
// retime) to a local list of sessions, leaving every other field alone.
export function withStartTimes(
  sessions: WorkSession[],
  updates: { id: string; startTime: string }[],
): WorkSession[] {
  const times = new Map(updates.map((update) => [update.id, update.startTime]));
  return sessions.map((session) =>
    times.has(session.id) ? { ...session, startTime: times.get(session.id)! } : session,
  );
}

// The re-chained times that actually differ from what's saved, so a
// reorder only writes the sessions it moved. ("16:00:00" from the
// database and "16:00" from the chain are the same time.)
export function changedStartTimes(
  sessions: WorkSession[],
  times: Record<string, string>,
): { id: string; startTime: string }[] {
  return Object.entries(times)
    .filter(([id, startTime]) => {
      const current = sessions.find((session) => session.id === id)?.startTime;
      return !current || current.slice(0, 5) !== startTime;
    })
    .map(([id, startTime]) => ({ id, startTime }));
}
