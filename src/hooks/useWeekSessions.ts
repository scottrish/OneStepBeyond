import { useCallback, useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import { useAsyncData } from "./useAsyncData";
import * as workSessionService from "../services/workSessionService";
import type { WorkSession } from "../services/workSessionService";

// Every one of the student's Work Sessions, across all dates — Week
// Look-Ahead's own primary content (week-lookahead.md), unlike
// useAllWorkSessions, which is deliberately a non-critical secondary
// signal with no loadError/retry surface (fine for Plan's minor
// "already planned elsewhere" badge, not fine as this screen's actual
// data). Deferring a session already deletes its row rather than
// marking it "deferred" (see workSessionService.deleteWorkSession), so
// a session moved off a date simply never appears there again — no
// extra filtering needed here for that.
export function useWeekSessions(studentId: string) {
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchSessions = useCallback(
    () => workSessionService.listWorkSessionsForStudent(studentId),
    [studentId],
  );
  const {
    data: sessions,
    setData: setSessions,
    loading,
    loadError,
    retry,
  } = useAsyncData<WorkSession[]>(fetchSessions, []);

  async function removeSession(id: string): Promise<boolean> {
    setActionError(null);
    try {
      await workSessionService.deleteWorkSession(id);
      setSessions((prev) => prev.filter((session) => session.id !== id));
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    }
  }

  return { sessions, loading, loadError, actionError, retry, removeSession };
}
