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
