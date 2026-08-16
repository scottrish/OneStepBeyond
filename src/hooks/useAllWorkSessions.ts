import { useEffect, useState } from "react";
import * as workSessionService from "../services/workSessionService";
import type { WorkSession } from "../services/workSessionService";

// Every one of the student's work sessions, across all dates — used by
// Plan's Select step to warn when a candidate work item already has a
// planned session on a different day (docs/features/iterations/
// daily-planning/daily-planning.i03.md FR-1). Mirrors useEstimationDrift's
// shape: a non-critical signal with no loadError/retry surface, since a
// fetch failure here should just mean the warning doesn't show, not that
// planning is blocked.
export function useAllWorkSessions(studentId: string): WorkSession[] {
  const [sessions, setSessions] = useState<WorkSession[]>([]);

  useEffect(() => {
    let cancelled = false;

    workSessionService
      .listWorkSessionsForStudent(studentId)
      .then((data) => {
        if (!cancelled) setSessions(data);
      })
      .catch(() => {
        // Non-critical signal — leave sessions empty; the warning
        // simply won't show.
      });

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  return sessions;
}
