import { useCallback, useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import { useAsyncData } from "./useAsyncData";
import * as planningSessionService from "../services/planningSessionService";
import * as workSessionService from "../services/workSessionService";
import type { StartTimeUpdate, WorkSession } from "../services/workSessionService";
import { withStartTimes } from "../domain/sessionOrder";

export type PlanItem = {
  workItemId: string;
  plannedMinutes: number;
  startTime: string | null;
};

// Loads a single date's Work Sessions and orchestrates confirming a
// plan for that date (docs/features/daily-planning.md). See
// docs/decisions/20260816-daily-planning-confirm-write-order.md for why
// this deletes the date's previous planned sessions before inserting the
// new set, rather than mirroring workBreakdownService's insert-then-
// delete ordering.
export function useDailyPlanning(studentId: string, date: string) {
  const [actionError, setActionError] = useState<string | null>(null);

  // `date` (not just studentId) is a dependency here, since the day
  // picker changes it after mount — same "loading isn't reset when the
  // dependency changes mid-session" tradeoff useWorkItems already accepts
  // for assignmentId, kept consistent rather than introducing a
  // synchronous setState-in-effect (which react-hooks/set-state-in-effect
  // flags) to fix it for this hook alone.
  const fetchSessions = useCallback(
    () => workSessionService.listWorkSessionsForDate(studentId, date),
    [studentId, date],
  );
  const {
    data: workSessions,
    setData: setWorkSessions,
    loading,
    loadError,
    refetch: refetchSessions,
    retry,
  } = useAsyncData<WorkSession[]>(fetchSessions, []);

  // Confirming a plan: remove the date's previous not-yet-started
  // sessions, insert the newly confirmed set, then record one Planning
  // Session (Plan Confirmed Domain Event). Sequential awaited Supabase
  // calls, not a Postgres function/transaction — matching
  // workBreakdownService.confirmWorkBreakdown's own pattern for a
  // multi-table write in this codebase.
  async function confirmPlan(items: PlanItem[]): Promise<boolean> {
    setActionError(null);
    try {
      // Append-only: confirming adds this pass's items to the day and never
      // deletes what's already planned — docs/decisions/
      // 20260925-confirm-plan-appends.md (superseding the delete-then-insert
      // replace of 20260816-daily-planning-confirm-write-order.md point 1).
      // The plan itself is edited per session in Plan's day view.
      const created = await workSessionService.createWorkSessions(
        studentId,
        items.map((item) => ({
          workItemId: item.workItemId,
          date,
          plannedMinutes: item.plannedMinutes,
          startTime: item.startTime,
        })),
      );

      await planningSessionService.recordPlanningSession(studentId, {
        date,
        itemsPlanned: items.length,
        minutesPlanned: items.reduce((sum, item) => sum + item.plannedMinutes, 0),
      });

      setWorkSessions((prev) => [...prev, ...created]);
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      // State may now disagree with the server (e.g. the insert succeeded
      // but recording the planning session failed) — reload rather than
      // trust local state.
      refetchSessions();
      return false;
    }
  }

  // The Day step's "remove" affordance for a single already-planned item.
  async function removeSession(id: string): Promise<boolean> {
    setActionError(null);
    try {
      await workSessionService.deleteWorkSession(id);
      setWorkSessions((prev) => prev.filter((session) => session.id !== id));
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
    setWorkSessions((prev) => withStartTimes(prev, updates));
    try {
      await workSessionService.updateWorkSessionStartTimes(updates);
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      refetchSessions();
      return false;
    }
  }

  return {
    workSessions,
    loading,
    loadError,
    actionError,
    retry,
    confirmPlan,
    removeSession,
    retimeSessions,
  };
}
