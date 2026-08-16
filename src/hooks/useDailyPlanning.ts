import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import * as planningSessionService from "../services/planningSessionService";
import * as workSessionService from "../services/workSessionService";
import type { WorkSession } from "../services/workSessionService";

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
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // `date` (not just studentId) is a dependency here, since the day
  // picker changes it after mount — same "loading isn't reset when the
  // dependency changes mid-session" tradeoff useWorkItems already accepts
  // for assignmentId, kept consistent rather than introducing a
  // synchronous setState-in-effect (which react-hooks/set-state-in-effect
  // flags) to fix it for this hook alone.
  const fetchSessions = useCallback(() => {
    return workSessionService
      .listWorkSessionsForDate(studentId, date)
      .then((data) => setWorkSessions(data))
      .catch((error) => setLoadError(errorMessage(error)))
      .finally(() => setLoading(false));
  }, [studentId, date]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  function retry() {
    setLoading(true);
    setLoadError(null);
    fetchSessions();
  }

  // Confirming a plan: remove the date's previous not-yet-started
  // sessions, insert the newly confirmed set, then record one Planning
  // Session (Plan Confirmed Domain Event). Sequential awaited Supabase
  // calls, not a Postgres function/transaction — matching
  // workBreakdownService.confirmWorkBreakdown's own pattern for a
  // multi-table write in this codebase.
  async function confirmPlan(items: PlanItem[]): Promise<boolean> {
    setActionError(null);
    try {
      await workSessionService.deletePlannedSessionsForDate(studentId, date);

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

      setWorkSessions((prev) => [
        ...prev.filter((session) => session.status !== "planned"),
        ...created,
      ]);
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      // State may now disagree with the server (e.g. delete succeeded
      // but insert failed) — reload rather than trust local state.
      fetchSessions();
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

  return {
    workSessions,
    loading,
    loadError,
    actionError,
    retry,
    confirmPlan,
    removeSession,
  };
}
