import { useCallback, useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import { useAsyncData } from "./useAsyncData";
import * as assignmentService from "../services/assignmentService";
import type { Assignment, AssignmentEdit } from "../services/assignmentService";

export function useAssignment(id: string) {
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchAssignment = useCallback(() => assignmentService.getAssignment(id), [id]);
  const {
    data: assignment,
    setData: setAssignment,
    loading,
    loadError,
    refetch: fetchAssignmentAgain,
  } = useAsyncData<Assignment | null>(fetchAssignment, null);

  async function updateAssignment(patch: AssignmentEdit): Promise<boolean> {
    setActionError(null);
    try {
      await assignmentService.updateAssignment(id, patch);
      setAssignment((prev) =>
        prev
          ? {
              ...prev,
              title: patch.title,
              dueDate: patch.dueDate,
              effortMinutes: patch.effortMinutes,
              notes: patch.notes.trim() === "" ? null : patch.notes,
            }
          : prev,
      );
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    }
  }

  async function deleteAssignment(): Promise<boolean> {
    setActionError(null);
    try {
      await assignmentService.deleteAssignment(id);
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    }
  }

  async function completeAssignment(): Promise<boolean> {
    setActionError(null);
    try {
      await assignmentService.completeAssignment(id);
      setAssignment((prev) =>
        prev ? { ...prev, completedAt: new Date().toISOString() } : prev,
      );
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    }
  }

  return {
    assignment,
    loading,
    loadError,
    actionError,
    refetch: fetchAssignmentAgain,
    updateAssignment,
    deleteAssignment,
    completeAssignment,
  };
}
