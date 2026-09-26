import { useCallback, useEffect, useRef, useState } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { writeCount } from "../lib/networkStatus";
import * as workSessionService from "../services/workSessionService";
import type { WorkSession } from "../services/workSessionService";

export type UseAllWorkSessionsResult = {
  sessions: WorkSession[];
  loading: boolean;
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
// `loading` exists so a caller that treats this data as more than a
// secondary signal (Home Dashboard's Needs Attention, which changes what
// it shows once this resolves) can gate its own render on it — without
// that, the affected content flashes once between an incomplete and a
// final answer. Plan's own use of this hook ignores the field entirely,
// which is fine: its "already planned elsewhere" badge is minor enough
// secondary text that the same flash was never a real problem there.
//
// `refetch` exists because this hook otherwise only fetches once on mount:
// confirming a plan creates a new Work Session without this hook's
// knowledge, so a commitment made earlier in the same browsing session
// wouldn't show up as "already planned" when checking another day right
// after (docs/playwright/daily-planning/iteration-03/findings.yaml
// FINDING-DP-003). Callers are expected to call it after a successful
// confirmPlan.
//
// Instant screens (instant-screen-data-v0.1.md, J3): starts from the app's
// last-known copy when there is one, and sets aside a read a save may have
// overtaken (F1), as useAsyncData does.
export function useAllWorkSessions(studentId: string): UseAllWorkSessionsResult {
  const [start] = useState(() => workSessionService.peekWorkSessionsForStudent(studentId));
  const [sessions, setSessions] = useState<WorkSession[]>(start ?? []);
  const [loading, setLoading] = useState(start === undefined);

  const fetchSessions = useCallback(() => {
    let cancelled = false;
    const writesAtStart = writeCount();

    workSessionService
      .listWorkSessionsForStudent(studentId)
      .then((data) => {
        if (cancelled) return;
        // Overtaken by a save: read again rather than show what may predate it.
        if (writeCount() !== writesAtStart) {
          workSessionService
            .listWorkSessionsForStudent(studentId)
            .then((again) => {
              if (!cancelled) setSessions(again);
            })
            .catch(() => {});
          return;
        }
        setSessions(data);
      })
      .catch(() => {
        // Non-critical signal — leave sessions as they are; the warning
        // simply won't show/update.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  useEffect(() => fetchSessions(), [fetchSessions]);

  // Back online: read again (PWA phase 2, 2b).
  const online = useOnlineStatus();
  const wasOffline = useRef(!online);
  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      return;
    }
    if (!wasOffline.current) return;
    wasOffline.current = false;
    return fetchSessions();
  }, [online, fetchSessions]);

  return { sessions, loading, refetch: fetchSessions };
}
