import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import * as preferencesService from "../services/preferencesService";
import { DEFAULT_PREFERENCES } from "../services/preferencesService";
import type { Preferences, PreferencesInput } from "../services/preferencesService";

export function usePreferences(studentId: string) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchPreferences = useCallback(() => {
    return preferencesService
      .getPreferences(studentId)
      .then((data) => setPreferences(data))
      .catch((error) => setLoadError(errorMessage(error)))
      .finally(() => setLoading(false));
  }, [studentId]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  function retry() {
    setLoading(true);
    setLoadError(null);
    fetchPreferences();
  }

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
