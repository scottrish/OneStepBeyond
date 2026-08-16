import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import * as assignmentService from "../services/assignmentService";
import type { Assignment, AssignmentEdit } from "../services/assignmentService";

export function useAssignment(id: string) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchAssignment = useCallback(() => {
    return assignmentService
      .getAssignment(id)
      .then((data) => setAssignment(data))
      .catch((error) => setLoadError(errorMessage(error)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

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
    refetch: fetchAssignment,
    updateAssignment,
    deleteAssignment,
    completeAssignment,
  };
}
