import { useCallback, useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import { useAsyncData } from "./useAsyncData";
import * as preferencesService from "../services/preferencesService";
import { DEFAULT_PREFERENCES } from "../services/preferencesService";
import type { Preferences, PreferencesInput } from "../services/preferencesService";

export function usePreferences(studentId: string) {
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchPreferences = useCallback(
    () => preferencesService.getPreferences(studentId),
    [studentId],
  );
  const {
    data: preferences,
    setData: setPreferences,
    loading,
    loadError,
    retry,
  } = useAsyncData<Preferences>(fetchPreferences, DEFAULT_PREFERENCES);

  async function savePreferences(input: PreferencesInput): Promise<boolean> {
    setActionError(null);
    try {
      const saved = await preferencesService.upsertPreferences(studentId, input);
      setPreferences(saved);
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    }
  }

  return {
    preferences,
    loading,
    loadError,
    actionError,
    retry,
    savePreferences,
  };
}
