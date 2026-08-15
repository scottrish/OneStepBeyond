import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import * as assignmentService from "../services/assignmentService";
import type { Assignment } from "../services/assignmentService";

export function useAssignment(id: string) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  return { assignment, loading, loadError };
}
