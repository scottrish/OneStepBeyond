import type { Assignment } from "../services/assignmentService";
import type { WorkItem } from "../services/workItemService";

// docs/features/daily-planning.md: "Candidates are open Work Items only
// (assignment not completed, item not completed), sorted by parent
// assignment's due date." An assignment with no Work Items yet (never
// broken down) contributes no candidates — matching the prototype's
// plan.tsx exactly (workItemsFor(...).flatMap(...)); breaking it down
// first is Work Breakdown's job, not Daily Planning's.
export type PlanningCandidate = {
  assignment: Assignment;
  workItem: WorkItem;
};

export function rankCandidates(
  assignments: Assignment[],
  workItems: WorkItem[],
): PlanningCandidate[] {
  return assignments
    .filter((assignment) => assignment.completedAt === null)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .flatMap((assignment) =>
      workItems
        .filter((item) => item.assignmentId === assignment.id && item.completedAt === null)
        .map((workItem) => ({ assignment, workItem })),
    );
}

// Plan opened for one assignment ("Find time", "Make a plan", Assignment
// Detail's "Plan work for today") or one specific step ("Plan it as one
// piece") — daily-planning-and-completion-v2-proposal.md item 1,
// implementing home-dashboard-followthrough.md §4.
export type PlanTarget =
  | { kind: "assignment"; assignmentId: string }
  | { kind: "pick"; workItemId: string };

type TargetSession = {
  workItemId: string;
  date: string;
  status: "planned" | "in_progress" | "done";
};

export function targetAssignmentId(
  target: PlanTarget | null,
  candidates: PlanningCandidate[],
): string | null {
  if (!target) return null;
  if (target.kind === "assignment") return target.assignmentId;
  return candidates.find((c) => c.workItem.id === target.workItemId)?.assignment.id ?? null;
}

/**
 * The target assignment's rows first, so what the student came for is
 * the first thing they see; everything else keeps its due-date order.
 */
export function targetFirst(
  candidates: PlanningCandidate[],
  assignmentId: string | null,
): PlanningCandidate[] {
  if (!assignmentId) return candidates;
  return [
    ...candidates.filter((c) => c.assignment.id === assignmentId),
    ...candidates.filter((c) => c.assignment.id !== assignmentId),
  ];
}

/**
 * Which steps to pre-select for a target on `date`. `unavailable` holds
 * steps that can't be chosen for this day (already planned on it).
 * - A step target picks exactly that step, if it can be chosen.
 * - An assignment target picks its open steps that still need time: not
 *   already planned on another day on or before the due date. If that
 *   leaves nothing, it falls back to every step that can be chosen,
 *   rather than landing on an empty selection.
 * Only a starting point: the student can untick anything.
 */
export function preselectFor(
  target: PlanTarget,
  candidates: PlanningCandidate[],
  sessions: TargetSession[],
  date: string,
  unavailable: Set<string>,
): string[] {
  if (target.kind === "pick") {
    const found = candidates.some((c) => c.workItem.id === target.workItemId);
    return found && !unavailable.has(target.workItemId) ? [target.workItemId] : [];
  }

  const selectable = candidates.filter(
    (c) => c.assignment.id === target.assignmentId && !unavailable.has(c.workItem.id),
  );
  const stillNeedsTime = selectable.filter(
    (c) =>
      !sessions.some(
        (session) =>
          session.workItemId === c.workItem.id &&
          session.status !== "done" &&
          session.date !== date &&
          session.date <= c.assignment.dueDate,
      ),
  );
  return (stillNeedsTime.length > 0 ? stillNeedsTime : selectable).map((c) => c.workItem.id);
}
