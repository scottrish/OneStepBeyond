import { useCallback, useEffect, useState } from "react";
import * as workSessionService from "../services/workSessionService";
import type { WorkSession } from "../services/workSessionService";

export type UseAllWorkSessionsResult = {
  sessions: WorkSession[];
  refetch: () => void;
};

// Every one of the student's work sessions, across all dates — used by
// Plan's Select step to warn when a candidate work item already has a
// planned session on a different day (docs/features/iterations/
// daily-planning/daily-planning.i03.md FR-1). Mirrors useEstimationDrift's
// shape: a non-critical signal with no loadError/retry surface, since a
// fetch failure here should just mean the warning doesn't show, not that
// planning is blocked.
//
// `refetch` exists because this hook otherwise only fetches once on mount:
// confirming a plan creates a new Work Session without this hook's
// knowledge, so a commitment made earlier in the same browsing session
// wouldn't show up as "already planned" when checking another day right
// after (docs/playwright/daily-planning/iteration-03/findings.yaml
// FINDING-DP-003). Callers are expected to call it after a successful
// confirmPlan.
export function useAllWorkSessions(studentId: string): UseAllWorkSessionsResult {
  const [sessions, setSessions] = useState<WorkSession[]>([]);

  const fetchSessions = useCallback(() => {
    let cancelled = false;

    workSessionService
      .listWorkSessionsForStudent(studentId)
      .then((data) => {
        if (!cancelled) setSessions(data);
      })
      .catch(() => {
        // Non-critical signal — leave sessions as they are; the warning
        // simply won't show/update.
      });

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  useEffect(() => fetchSessions(), [fetchSessions]);

  return { sessions, refetch: fetchSessions };
}
