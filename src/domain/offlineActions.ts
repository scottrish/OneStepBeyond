import type { Assignment } from "../services/assignmentService";
import type { WorkItem } from "../services/workItemService";
import type { WorkSession } from "../services/workSessionService";
import { isNetworkFailureMessage } from "./offlineWording";

// The actions that work offline (PWA phase 2, increment 2c —
// docs/features/pwa-phase-2-offline-v0.1.md, question 4; decisions W3 and
// Q2): what a student does mid-session, and everything the Done flow
// saves. Each carries the device's time, so a late save still records
// when it really happened.
export type OfflineAction =
  | { kind: "startSession"; sessionId: string; at: string }
  | { kind: "completeSession"; sessionId: string; at: string }
  | { kind: "reviseEstimate"; sessionId: string; plannedMinutes: number; originalPlannedMinutes: number }
  | { kind: "clearSession"; sessionId: string }
  | { kind: "completeStep"; workItemId: string; at: string }
  | { kind: "completeAssignment"; assignmentId: string; at: string }
  | { kind: "recordReflection"; row: Record<string, unknown> }
  | { kind: "recordFriction"; row: Record<string, unknown> }
  | { kind: "resolveInteraction"; interactionId: string; patch: Record<string, string | null> };

export type QueuedAction = {
  id: string;
  action: OfflineAction;
  attempts: number;
  /** Three real failures: waits for Try again or Discard in Settings. */
  stuck: boolean;
};

// ——— Showing queued actions ———
// Every read the offline screens make shows the actions still waiting to
// be sent, whether the data came fresh from the server or from storage —
// so the screen never goes back to how it was before the student acted.

function applyToSessions(sessions: WorkSession[], actions: OfflineAction[]): WorkSession[] {
  let result = sessions;
  for (const action of actions) {
    switch (action.kind) {
      case "startSession":
        result = result.map((s) =>
          s.id === action.sessionId && s.status === "planned"
            ? { ...s, status: "in_progress", startedAt: action.at }
            : s,
        );
        break;
      case "completeSession":
        result = result.map((s) =>
          s.id === action.sessionId && s.status !== "done"
            ? { ...s, status: "done", completedAt: action.at }
            : s,
        );
        break;
      case "reviseEstimate":
        result = result.map((s) =>
          s.id === action.sessionId
            ? {
                ...s,
                plannedMinutes: action.plannedMinutes,
                originalPlannedMinutes: action.originalPlannedMinutes,
              }
            : s,
        );
        break;
      case "clearSession":
        result = result.filter((s) => s.id !== action.sessionId || s.status === "done");
        break;
    }
  }
  return result;
}

function applyToWorkItems(items: WorkItem[], actions: OfflineAction[]): WorkItem[] {
  let result = items;
  for (const action of actions) {
    if (action.kind === "completeStep") {
      result = result.map((item) =>
        item.id === action.workItemId && item.completedAt === null
          ? { ...item, completedAt: action.at }
          : item,
      );
    }
  }
  return result;
}

function applyToAssignment(assignment: Assignment, actions: OfflineAction[]): Assignment {
  for (const action of actions) {
    if (action.kind === "completeAssignment" && action.assignmentId === assignment.id && !assignment.completedAt) {
      assignment = { ...assignment, completedAt: action.at };
    }
  }
  return assignment;
}

/**
 * The read `key` (as passed to cachedRead) with `actions` applied. Reads
 * that no queued action affects come back unchanged.
 */
export function applyPending(key: string, data: unknown, actions: OfflineAction[]): unknown {
  if (actions.length === 0) return data;
  if (key.startsWith("workSessions:")) return applyToSessions(data as WorkSession[], actions);
  if (key === "workItems" || key.startsWith("workItemsFor:")) return applyToWorkItems(data as WorkItem[], actions);
  if (key === "assignments") return (data as Assignment[]).map((a) => applyToAssignment(a, actions));
  if (key.startsWith("assignment:")) return data ? applyToAssignment(data as Assignment, actions) : data;
  return data;
}

// ——— What a failed send means ———

export type SendFailure =
  /** The server wasn't reached: keep it queued, try when back online. */
  | "offline"
  /** The plan changed on another device (e.g. the session was removed): drop it. */
  | "conflict"
  /** A real failure: retry with backoff, then wait in Settings. */
  | "failed";

// A foreign key that no longer exists: what was being recorded against
// (a session, a step, an assignment) was removed on another device.
const FOREIGN_KEY_VIOLATION = "23503";

export function classifySendError(error: unknown): SendFailure {
  const { message, code } = (error ?? {}) as { message?: unknown; code?: unknown };
  if (typeof message === "string" && isNetworkFailureMessage(message)) return "offline";
  if (code === FOREIGN_KEY_VIOLATION) return "conflict";
  return "failed";
}

/** Waits between real-failure retries: after the 1st and 2nd. The 3rd leaves it stuck. */
export const RETRY_DELAYS_MS = [1000, 5000];
export const MAX_ATTEMPTS = 3;
