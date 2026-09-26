import { useCallback, useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import { useAsyncData } from "./useAsyncData";
import * as workItemService from "../services/workItemService";
import * as workSessionService from "../services/workSessionService";
import { revisedEstimate } from "../domain/executionTiming";
import type { WorkSession } from "../services/workSessionService";

// docs/features/today-execution.md: "Need more time" adds a fixed 10
// minutes, no penalty framing — keeping the original estimate alongside
// (execution-coaching-v0.1.md, "Revised estimate, shown honestly").
export const NEED_MORE_TIME_MINUTES = 10;

// Loads today's Work Sessions and orchestrates the actions Today
// Execution offers on the current task (docs/features/today-execution.md).
// Mirrors useDailyPlanning's shape (fetch/retry/actionError), but the
// underlying operations are different: no multi-row replace, just single-
// row mutations (recording start/finish times — execution-coaching-
// v0.1.md), or a delete for "move to tomorrow"
// (same operation Daily Planning's Remove/Move already use — deferred
// sessions "drop out of today's list entirely... not cancelled, just
// moved").
export function useTodayExecution(studentId: string, date: string) {
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchSessions = useCallback(
    () => workSessionService.listWorkSessionsForDate(studentId, date),
    [studentId, date],
  );
  const {
    data: sessions,
    setData: setSessions,
    loading,
    loadError,
    retry,
  } = useAsyncData<WorkSession[]>(fetchSessions, []);

  async function start(id: string): Promise<boolean> {
    setActionError(null);
    try {
      const startedAt = await workSessionService.startWorkSession(id);
      setSessions((prev) =>
        prev.map((session) =>
          session.id === id ? { ...session, status: "in_progress", startedAt } : session,
        ),
      );
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    }
  }

  // Done. `closeStep`: also complete the session's step — unless the
  // student said "Not yet — keep the rest of the plan" to "Is the whole
  // task done?". `clearSessionIds`: that step's other sessions, removed on
  // "Yes — clear the other time" (execution-coaching-v0.1.md).
  async function complete(
    id: string,
    { closeStep = true, clearSessionIds = [] }: { closeStep?: boolean; clearSessionIds?: string[] } = {},
  ): Promise<boolean> {
    const session = sessions.find((s) => s.id === id);
    if (!session) return false;
    setActionError(null);
    try {
      // Completing the session (what Plan/Today track) and completing its
      // underlying Work Item's step (what Assignment Detail's checklist
      // reads) are two different records — both must be marked done, or
      // the two screens silently disagree about what's finished.
      const [completedAt] = await Promise.all([
        workSessionService.completeWorkSession(id),
        closeStep ? workItemService.completeWorkItem(session.workItemId) : Promise.resolve(),
        ...clearSessionIds.map((otherId) => workSessionService.deleteWorkSession(otherId)),
      ]);
      setSessions((prev) =>
        prev
          .filter((s) => !clearSessionIds.includes(s.id))
          .map((s) => (s.id === id ? { ...s, status: "done", completedAt } : s)),
      );
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    }
  }

  async function needMoreTime(id: string): Promise<boolean> {
    const session = sessions.find((s) => s.id === id);
    if (!session) return false;
    setActionError(null);
    const next = revisedEstimate(session, NEED_MORE_TIME_MINUTES);
    try {
      await workSessionService.reviseWorkSessionEstimate(
        id,
        next.plannedMinutes,
        next.originalPlannedMinutes,
      );
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...next } : s)));
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    }
  }

  // "I'm stuck" -> "Move to tomorrow".
  async function defer(id: string): Promise<boolean> {
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

  return {
    sessions,
    loading,
    loadError,
    actionError,
    retry,
    start,
    complete,
    needMoreTime,
    defer,
  };
}
