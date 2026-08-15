import type { Assignment } from "../services/assignmentService";
import type { WorkItem } from "../services/workItemService";

// docs/features/assignment-management.md: "Remaining effort is computed,
// not stored: from open Work Items' estimates when a breakdown exists,
// otherwise from the assignment's own estimate."
export function remainingMinutes(
  assignment: Assignment,
  workItems: WorkItem[],
): number {
  if (workItems.length === 0) return assignment.effortMinutes;

  return workItems
    .filter((item) => item.completedAt === null)
    .reduce((total, item) => total + item.effortMinutes, 0);
}
