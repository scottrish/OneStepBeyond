import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import * as workItemService from "../services/workItemService";
import type { WorkItem } from "../services/workItemService";

export function useWorkItems(assignmentId: string) {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchWorkItems = useCallback(() => {
    return workItemService
      .listWorkItems(assignmentId)
      .then((data) => setWorkItems(data))
      .catch((error) => setLoadError(errorMessage(error)))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  useEffect(() => {
    fetchWorkItems();
  }, [fetchWorkItems]);

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

  return {
    workItems,
    loading,
    loadError,
    actionError,
    refetch: fetchWorkItems,
    markAllComplete,
  };
}
