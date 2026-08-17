import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "../lib/errorMessage";
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
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchSessions = useCallback(() => {
    return workSessionService
      .listWorkSessionsForStudent(studentId)
      .then((data) => setSessions(data))
      .catch((error) => setLoadError(errorMessage(error)))
      .finally(() => setLoading(false));
  }, [studentId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  function retry() {
    setLoading(true);
    setLoadError(null);
    fetchSessions();
  }

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
