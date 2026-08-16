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
