import { useCallback, useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import { useAsyncData } from "./useAsyncData";
import * as workSessionService from "../services/workSessionService";
import type { StartTimeUpdate, WorkSession } from "../services/workSessionService";
import { withStartTimes } from "../domain/sessionOrder";

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
    refetch,
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

  // A reorder's re-chained times, or one session's retime — shown
  // immediately and saved in the background; on failure the error shows
  // and the day reloads from the server (docs/decisions/
  // 20260925-session-reorder-and-drag.md).
  async function retimeSessions(updates: StartTimeUpdate[]): Promise<boolean> {
    if (updates.length === 0) return true;
    setActionError(null);
    setSessions((prev) => withStartTimes(prev, updates));
    try {
      await workSessionService.updateWorkSessionStartTimes(updates);
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      refetch();
      return false;
    }
  }

  return { sessions, loading, loadError, actionError, retry, removeSession, retimeSessions };
}
