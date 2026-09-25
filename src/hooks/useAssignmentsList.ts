import { useCallback, useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import { useAsyncData } from "./useAsyncData";
import * as assignmentService from "../services/assignmentService";
import * as workItemService from "../services/workItemService";
import type { Assignment, AssignmentEdit } from "../services/assignmentService";
import type { WorkItem } from "../services/workItemService";

// Two collections, one fetch (Promise.all) — useAsyncData manages one
// piece of state, so they're combined into one object here and
// destructured back into two below; each `set*` stays its own function
// so editAssignment/removeAssignment don't need to know about the other
// collection.
type ListData = { assignments: Assignment[]; workItems: WorkItem[] };
const EMPTY_LIST_DATA: ListData = { assignments: [], workItems: [] };

export function useAssignmentsList(studentId: string) {
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchAll = useCallback(
    () =>
      Promise.all([
        assignmentService.listAssignments(studentId),
        workItemService.listWorkItemsForStudent(studentId),
      ]).then(([assignments, workItems]) => ({ assignments, workItems })),
    [studentId],
  );
  const { data, setData, loading, loadError, retry } = useAsyncData<ListData>(
    fetchAll,
    EMPTY_LIST_DATA,
  );
  const { assignments, workItems } = data;

  function setAssignments(updater: (prev: Assignment[]) => Assignment[]) {
    setData((prev) => ({ ...prev, assignments: updater(prev.assignments) }));
  }

  function setWorkItems(updater: (prev: WorkItem[]) => WorkItem[]) {
    setData((prev) => ({ ...prev, workItems: updater(prev.workItems) }));
  }

  async function editAssignment(
    id: string,
    patch: AssignmentEdit,
  ): Promise<boolean> {
    setActionError(null);
    try {
      await assignmentService.updateAssignment(id, patch);
      setAssignments((prev) =>
        prev.map((assignment) =>
          assignment.id === id
            ? {
                ...assignment,
                title: patch.title,
                dueDate: patch.dueDate,
                effortMinutes: patch.effortMinutes,
                notes: patch.notes.trim() === "" ? null : patch.notes,
              }
            : assignment,
        ),
      );
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    }
  }

  async function removeAssignment(id: string): Promise<boolean> {
    setActionError(null);
    try {
      await assignmentService.deleteAssignment(id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      setWorkItems((prev) => prev.filter((w) => w.assignmentId !== id));
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    }
  }

  // Plan's "All steps done" row (daily-planning-and-completion-v2-
  // proposal.md item 4): its steps are already complete, so only the
  // assignment itself needs marking.
  async function completeAssignment(id: string): Promise<boolean> {
    setActionError(null);
    try {
      await assignmentService.completeAssignment(id);
      const completedAt = new Date().toISOString();
      setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, completedAt } : a)));
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    }
  }

  return {
    assignments,
    workItems,
    loading,
    loadError,
    actionError,
    retry,
    editAssignment,
    removeAssignment,
    completeAssignment,
  };
}
