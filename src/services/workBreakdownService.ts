import * as assignmentService from "./assignmentService";
import * as decompositionAttemptService from "./decompositionAttemptService";
import * as workItemService from "./workItemService";
import type { Assignment } from "./assignmentService";
import type { WorkItem } from "./workItemService";

export type DraftWorkItem = {
  title: string;
  effortMinutes: number;
};

// Confirms a "Break this down" draft: inserts the new confirmed Work
// Items, derives the Assignment's estimated effort from their sum (spec
// §5 "Assignment Estimated Effort"), then removes whatever Work Items
// existed before this edit session, then records one DecompositionAttempt.
// Insert-before-delete is deliberate — see
// docs/decisions/20260815-manual-work-breakdown-draft-state.md.
export async function confirmWorkBreakdown(
  studentId: string,
  assignment: Assignment,
  previousItems: WorkItem[],
  draftItems: DraftWorkItem[],
  revisionCount: number,
): Promise<WorkItem[]> {
  const created = await workItemService.createWorkItems(
    studentId,
    draftItems.map((item, index) => ({
      assignmentId: assignment.id,
      title: item.title,
      effortMinutes: item.effortMinutes,
      position: index,
    })),
  );

  const totalEffortMinutes = draftItems.reduce(
    (sum, item) => sum + item.effortMinutes,
    0,
  );
  await assignmentService.updateAssignment(assignment.id, {
    title: assignment.title,
    dueDate: assignment.dueDate,
    notes: assignment.notes ?? "",
    effortMinutes: totalEffortMinutes,
  });

  if (previousItems.length > 0) {
    await workItemService.deleteWorkItems(previousItems.map((item) => item.id));
  }

  await decompositionAttemptService.recordDecompositionAttempt(studentId, {
    assignmentId: assignment.id,
    initialWorkItems: previousItems.map((item) => item.title),
    resultingWorkItems: draftItems.map((item) => item.title),
    revisionCount,
    outcome: "confirmed",
  });

  return created;
}
