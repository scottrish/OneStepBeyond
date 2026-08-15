import { useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import * as assignmentService from "../services/assignmentService";
import type { NewAssignment } from "../services/assignmentService";

export function useCreateAssignment(studentId: string) {
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function createAssignment(input: NewAssignment): Promise<string | null> {
    setActionError(null);
    setSaving(true);
    try {
      const assignment = await assignmentService.createAssignment(
        studentId,
        input,
      );
      return assignment.id;
    } catch (error) {
      setActionError(errorMessage(error));
      return null;
    } finally {
      setSaving(false);
    }
  }

  return { createAssignment, saving, actionError };
}
