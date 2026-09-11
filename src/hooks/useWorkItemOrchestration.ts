import * as decompositionAttemptService from "../services/decompositionAttemptService";
import type { Assignment, AssignmentEdit } from "../services/assignmentService";
import type { WorkItem, WorkItemEdit } from "../services/workItemService";

type AddItem = (title: string, effortMinutes: number) => Promise<WorkItem[] | null>;
type EditItem = (id: string, patch: WorkItemEdit) => Promise<WorkItem[] | null>;
type DeleteItem = (id: string) => Promise<WorkItem[] | null>;

// docs/decisions/20260911-architecture-refactor-proposal.md increment 4
// — the two side effects Assignment Detail's inline step add/edit
// (docs/features/assignment-detail-cta-hierarchy.md item 3b) must apply
// on top of the plain CRUD useWorkItems already does: recomputing the
// Assignment's total effort as the sum of its confirmed Work Items (the
// same §5-style derivation confirmWorkBreakdown already applies for the
// bulk-replace case), and recording one DecompositionAttempt per add/edit
// — preserving the evidentiary trail
// docs/decisions/20260815-manual-work-breakdown-draft-state.md's
// single-entry-point design existed to guarantee, even though that
// design's own mechanism (WorkBreakdownPage as the only entry point) no
// longer holds. Delete does not record an attempt — see item 3b's
// Functional Requirements for why.
export function useWorkItemOrchestration(params: {
  userId: string;
  assignmentId: string;
  assignment: Assignment | null;
  updateAssignment: (patch: AssignmentEdit) => Promise<boolean>;
  addItem: AddItem;
  editItem: EditItem;
  deleteItem: DeleteItem;
}) {
  const { userId, assignmentId, assignment, updateAssignment, addItem, editItem, deleteItem } = params;

  async function recomputeAssignmentEffort(updatedItems: WorkItem[]) {
    if (!assignment) return;
    const totalEffortMinutes = updatedItems.reduce((sum, item) => sum + item.effortMinutes, 0);
    await updateAssignment({
      title: assignment.title,
      dueDate: assignment.dueDate,
      effortMinutes: totalEffortMinutes,
      notes: assignment.notes ?? "",
    });
  }

  async function recordStepDecompositionAttempt(initialItems: WorkItem[], updatedItems: WorkItem[]) {
    await decompositionAttemptService.recordDecompositionAttempt(userId, {
      assignmentId,
      initialWorkItems: initialItems.map((item) => item.title),
      resultingWorkItems: updatedItems.map((item) => item.title),
      revisionCount: 1,
      outcome: "confirmed",
    });
  }

  async function addStep(
    title: string,
    effortMinutes: number,
    currentItems: WorkItem[],
  ): Promise<WorkItem[] | null> {
    const updated = await addItem(title, effortMinutes);
    if (updated) {
      await recomputeAssignmentEffort(updated);
      await recordStepDecompositionAttempt(currentItems, updated);
    }
    return updated;
  }

  async function editStep(
    id: string,
    patch: WorkItemEdit,
    currentItems: WorkItem[],
  ): Promise<WorkItem[] | null> {
    const updated = await editItem(id, patch);
    if (updated) {
      await recomputeAssignmentEffort(updated);
      await recordStepDecompositionAttempt(currentItems, updated);
    }
    return updated;
  }

  async function deleteStep(id: string): Promise<WorkItem[] | null> {
    const updated = await deleteItem(id);
    if (updated) {
      await recomputeAssignmentEffort(updated);
    }
    return updated;
  }

  return { addStep, editStep, deleteStep, recomputeAssignmentEffort };
}
