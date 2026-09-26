import { useState } from "react";
import { errorMessage } from "../../lib/errorMessage";
import {
  activityBlocks,
  firstOverlap,
  rechainDay,
  sessionBlocks,
  toMinutes,
  type BusyBlock,
} from "../../domain/defaultStartTimes";
import { moveItem } from "../../domain/reorder";
import { changedStartTimes, sortByStartTime } from "../../domain/sessionOrder";
import type { StudySlot } from "../../domain/studyCapacity";
import type { Activity } from "../../services/activityService";
import * as workSessionService from "../../services/workSessionService";
import type { StartTimeUpdate, WorkSession } from "../../services/workSessionService";

export const MIDNIGHT_MESSAGE =
  "That order runs past midnight. Try moving something to another day.";

type UseSessionEditingOptions = {
  studentId: string;
  date: string;
  workSessions: WorkSession[];
  slots: StudySlot[];
  commitments: Activity[];
  titleOf: (session: WorkSession) => string;
  removeSession: (id: string) => Promise<boolean>;
  retimeSessions: (updates: StartTimeUpdate[]) => Promise<boolean>;
  // Sessions were added or removed (a move or Remove) — Plan's cross-day
  // "planned elsewhere" data needs reloading. Times alone don't affect it.
  onSessionsChanged: () => void;
  // Keeps the day view showing after its last session is removed or
  // moved away, instead of switching to Select underneath the student.
  onKeepDayView: () => void;
};

// The existing-day view's per-session editing, split out of PlanPage
// (docs/decisions/20260912-page-complexity-reduction-proposal.md): the
// edit sheet's Move to another day and Remove (docs/decisions/
// 20260925-existing-day-view.md), plus reorder (drag, Earlier/Later) and
// retime (docs/decisions/20260925-session-reorder-and-drag.md). A saved
// day's reorders and retimes save immediately.
export function useSessionEditing({
  studentId,
  date,
  workSessions,
  slots,
  commitments,
  titleOf,
  removeSession,
  retimeSessions,
  onSessionsChanged,
  onKeepDayView,
}: UseSessionEditingOptions) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [moveTargetDate, setMoveTargetDate] = useState<string | null>(null);
  const [moveSubmitting, setMoveSubmitting] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [retimeError, setRetimeError] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);

  const daySessions = workSessions.filter((session) => session.date === date);
  const editingSession = daySessions.find((session) => session.id === editingSessionId);
  // The day's planned sessions in their current (time) order — what
  // Earlier/Later step through. Started and done sessions keep their place.
  const plannedOrder = sortByStartTime(
    daySessions.filter((session) => session.status === "planned"),
  ).map((session) => session.id);
  const activities = activityBlocks(commitments);

  function openEditor(sessionId: string) {
    setEditingSessionId(sessionId);
    setMoveTargetDate(null);
    setMoveError(null);
    setRetimeError(null);
    setReorderError(null);
  }

  function closeEditor() {
    setEditingSessionId(null);
    setMoveTargetDate(null);
    setMoveError(null);
    setRetimeError(null);
  }

  async function removeFromDay(session: WorkSession) {
    onKeepDayView();
    const removed = await removeSession(session.id);
    if (removed) {
      closeEditor();
      onSessionsChanged();
    }
  }

  // FR-3 (docs/features/iterations/daily-planning/daily-planning.i04.md):
  // relocates an already-planned (not-yet-started) session to a different
  // day in one action. Create-before-remove — same insert-before-delete
  // ordering this codebase always uses for a multi-step write, so a
  // failure partway through never deletes the original without anything
  // replacing it. Deliberately records no Planning Session Domain Event,
  // like Remove and reorder: only a full wizard confirm does.
  async function confirmMove(session: WorkSession) {
    if (!moveTargetDate) return;
    onKeepDayView();
    setMoveSubmitting(true);
    setMoveError(null);
    try {
      await workSessionService.createWorkSessions(studentId, [
        {
          workItemId: session.workItemId,
          date: moveTargetDate,
          plannedMinutes: session.plannedMinutes,
          // A revised estimate keeps its "first planned" history.
          originalPlannedMinutes: session.originalPlannedMinutes ?? null,
          // The target day's open slots differ from the original day's,
          // so there's no reliable time to carry over — left unset
          // rather than guessed.
          startTime: null,
        },
      ]);
    } catch (error) {
      setMoveError(errorMessage(error));
      setMoveSubmitting(false);
      return;
    }
    onSessionsChanged();
    const removed = await removeSession(session.id);
    setMoveSubmitting(false);
    // If removal failed, useDailyPlanning's own actionError already
    // surfaces it; leave the sheet open so the student can see the new
    // session now also exists and retry removing the original from here.
    if (removed) closeEditor();
  }

  // A drag drop (every row id, new order) or Earlier/Later: re-chain the
  // day's planned sessions in the new order and save the changed times.
  // Refused, with nothing changed, if the chain would run past midnight.
  async function reorder(orderedIds: string[]) {
    setReorderError(null);
    const planned = orderedIds.filter((id) => plannedOrder.includes(id));
    const times = rechainDay(daySessions, planned, slots, activities);
    if (!times) {
      setReorderError(MIDNIGHT_MESSAGE);
      return;
    }
    const updates = changedStartTimes(daySessions, times);
    await retimeSessions(updates);
  }

  function moveEarlierOrLater(session: WorkSession, direction: "up" | "down") {
    const index = plannedOrder.indexOf(session.id);
    if (index < 0) return;
    void reorder(moveItem(plannedOrder, index, direction));
  }

  // Everything else on the day that a single session's new time must not
  // overlap: every other timed session (any status) and the day's
  // activities with travel.
  function busyAround(session: WorkSession): BusyBlock[] {
    return [
      ...sessionBlocks(
        daySessions.filter((other) => other.id !== session.id),
        titleOf,
      ),
      ...activities,
    ];
  }

  function isFree(session: WorkSession, startTime: string): boolean {
    return !firstOverlap(toMinutes(startTime), session.plannedMinutes, busyAround(session));
  }

  // Never silently double-books or clamps: an overlapping time is refused
  // with the reason, and the session's time is left as it was.
  async function retime(session: WorkSession, startTime: string) {
    const overlap = firstOverlap(toMinutes(startTime), session.plannedMinutes, busyAround(session));
    if (overlap) {
      setRetimeError(`That time overlaps with ‘${overlap.label ?? "something else"}’. Pick a different start.`);
      return;
    }
    setRetimeError(null);
    await retimeSessions([{ id: session.id, startTime }]);
  }

  return {
    editingSession,
    plannedOrder,
    openEditor,
    closeEditor,
    moveTargetDate,
    setMoveTargetDate,
    moveSubmitting,
    moveError,
    confirmMove,
    removeFromDay,
    reorder,
    reorderError,
    dismissReorderError: () => setReorderError(null),
    moveEarlierOrLater,
    retime,
    isFree,
    retimeError,
    dismissRetimeError: () => setRetimeError(null),
  };
}
