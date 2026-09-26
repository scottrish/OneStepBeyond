import { useCallback, useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import { useAsyncData } from "./useAsyncData";
import * as workItemService from "../services/workItemService";
import type { WorkItem } from "../services/workItemService";

// docs/features/assignment-detail-cta-hierarchy.md item 3b: inline
// add/edit/delete, each returning the resulting full array so the caller
// (AssignmentDetailPage) can recompute the assignment's total effort and
// record a DecompositionAttempt without waiting on a second render to see
// the new state.
export function useWorkItems(studentId: string, assignmentId: string) {
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchWorkItems = useCallback(
    () => workItemService.listWorkItems(assignmentId),
    [assignmentId],
  );
  const {
    data: workItems,
    setData: setWorkItems,
    loading,
    loadError,
    refreshError,
    refetch: fetchWorkItemsAgain,
  } = useAsyncData<WorkItem[]>(fetchWorkItems, [], {
    peek: () => workItemService.peekWorkItems(assignmentId),
  });

  async function markAllComplete(): Promise<boolean> {
    setActionError(null);
    try {
      await workItemService.completeAllForAssignment(assignmentId);
      const now = new Date().toISOString();
      setWorkItems((prev) =>
        prev.map((item) =>
          item.completedAt ? item : { ...item, completedAt: now },
        ),
      );
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    }
  }

  async function addItem(title: string, effortMinutes: number): Promise<WorkItem[] | null> {
    setActionError(null);
    try {
      const position =
        workItems.length === 0 ? 0 : Math.max(...workItems.map((item) => item.position)) + 1;
      const created = await workItemService.createWorkItems(studentId, [
        { assignmentId, title, effortMinutes, position },
      ]);
      const updated = [...workItems, ...created];
      setWorkItems(updated);
      return updated;
    } catch (error) {
      setActionError(errorMessage(error));
      return null;
    }
  }

  async function editItem(
    id: string,
    patch: workItemService.WorkItemEdit,
  ): Promise<WorkItem[] | null> {
    setActionError(null);
    try {
      await workItemService.updateWorkItem(id, patch);
      const updated = workItems.map((item) => (item.id === id ? { ...item, ...patch } : item));
      setWorkItems(updated);
      return updated;
    } catch (error) {
      setActionError(errorMessage(error));
      return null;
    }
  }

  async function deleteItem(id: string): Promise<WorkItem[] | null> {
    setActionError(null);
    try {
      await workItemService.deleteWorkItems([id]);
      const updated = workItems.filter((item) => item.id !== id);
      setWorkItems(updated);
      return updated;
    } catch (error) {
      setActionError(errorMessage(error));
      return null;
    }
  }

  return {
    workItems,
    loading,
    loadError,
    refreshError,
    actionError,
    refetch: fetchWorkItemsAgain,
    markAllComplete,
    addItem,
    editItem,
    deleteItem,
  };
}
