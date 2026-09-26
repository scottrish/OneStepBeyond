import { effortLabel } from "./effortPresets";

// Today Execution's timing rules (docs/features/execution-coaching-v0.1.md,
// roadmap Phase 7 step 12a; docs/decisions/20260925-execution-timing.md).

type EstimatedSession = {
  plannedMinutes: number;
  originalPlannedMinutes?: number | null;
};

/**
 * "Need more time": the new working estimate, and the original to keep —
 * the first revision records what it replaced; later ones keep that same
 * first number, so history is never overwritten.
 */
export function revisedEstimate(
  session: EstimatedSession,
  extraMinutes: number,
): { plannedMinutes: number; originalPlannedMinutes: number } {
  return {
    plannedMinutes: session.plannedMinutes + extraMinutes,
    originalPlannedMinutes: session.originalPlannedMinutes ?? session.plannedMinutes,
  };
}

/**
 * The estimate as the student sees it: "30m", or once revised,
 * "about 40m · first planned 30m" — shown honestly, not silently replaced.
 */
export function estimateLabel(session: EstimatedSession): string {
  const original = session.originalPlannedMinutes;
  if (original == null || original === session.plannedMinutes) return effortLabel(session.plannedMinutes);
  return `about ${effortLabel(session.plannedMinutes)} · first planned ${effortLabel(original)}`;
}

type TaskSession = {
  id: string;
  workItemId: string;
  date: string;
  status: "planned" | "in_progress" | "done";
};

/**
 * The same step's other not-yet-done sessions — "You also have time set
 * aside for this on …". Finishing a session asks "Is the whole task done?"
 * only when there are some.
 */
export function otherOpenSessionsFor<S extends TaskSession>(session: TaskSession, all: S[]): S[] {
  return all
    .filter(
      (other) =>
        other.id !== session.id &&
        other.workItemId === session.workItemId &&
        other.status !== "done",
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}
