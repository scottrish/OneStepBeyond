import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import * as assignmentService from "../services/assignmentService";
import * as workItemService from "../services/workItemService";
import type { Assignment, AssignmentEdit } from "../services/assignmentService";
import type { WorkItem } from "../services/workItemService";

export function useAssignmentsList(studentId: string) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchAll = useCallback(() => {
    return Promise.all([
      assignmentService.listAssignments(studentId),
      workItemService.listWorkItemsForStudent(studentId),
    ])
      .then(([nextAssignments, nextWorkItems]) => {
        setAssignments(nextAssignments);
        setWorkItems(nextWorkItems);
      })
      .catch((error) => setLoadError(errorMessage(error)))
      .finally(() => setLoading(false));
  }, [studentId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function retry() {
    setLoading(true);
    setLoadError(null);
    fetchAll();
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

  return {
    assignments,
    workItems,
    loading,
    loadError,
    actionError,
    retry,
    editAssignment,
    removeAssignment,
  };
}
