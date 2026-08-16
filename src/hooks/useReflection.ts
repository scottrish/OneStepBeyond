import { useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import * as reflectionService from "../services/reflectionService";
import type { NewReflection } from "../services/reflectionService";

export function useReflection(studentId: string) {
  const [actionError, setActionError] = useState<string | null>(null);

  async function submitReflection(input: NewReflection): Promise<boolean> {
    setActionError(null);
    try {
      await reflectionService.recordReflection(studentId, input);
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    }
  }

  return { actionError, submitReflection };
}
