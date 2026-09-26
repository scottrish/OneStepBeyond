import { useCallback, useRef, useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import { useAsyncData } from "./useAsyncData";
import * as preferencesService from "../services/preferencesService";
import { DEFAULT_PREFERENCES } from "../services/preferencesService";
import type { Preferences, PreferencesInput } from "../services/preferencesService";

export type SaveStatus = "idle" | "saving" | "saved";

export function usePreferences(studentId: string) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  // Study hours save on every change (docs/decisions/
  // 20260925-split-weekend-study-hours.md, S1), so taps can outrun the
  // network. One save at a time: a change made while one is in flight
  // waits, and only the newest waiting value is sent — replies can't
  // arrive out of order and overwrite a newer tap.
  const inFlight = useRef(false);
  const waiting = useRef<PreferencesInput | null>(null);
  const latest = useRef<PreferencesInput | null>(null);

  const fetchPreferences = useCallback(
    () => preferencesService.getPreferences(studentId),
    [studentId],
  );
  const {
    data: preferences,
    setData: setPreferences,
    loading,
    loadError,
    refreshError,
    retry,
  } = useAsyncData<Preferences>(fetchPreferences, DEFAULT_PREFERENCES, {
    peek: () => preferencesService.peekPreferences(studentId),
  });

  // Shows the new value straight away. On failure it stays on screen with
  // the error, and the next change (or retrySave) sends it again — every
  // save is the whole set of preferences, so nothing is lost.
  async function savePreferences(input: PreferencesInput): Promise<boolean> {
    setActionError(null);
    setPreferences(input);
    latest.current = input;
    waiting.current = input;
    if (inFlight.current) return true;

    inFlight.current = true;
    setSaveStatus("saving");
    try {
      while (waiting.current) {
        const next = waiting.current;
        waiting.current = null;
        await preferencesService.upsertPreferences(studentId, next);
      }
      setSaveStatus("saved");
      return true;
    } catch (error) {
      waiting.current = null;
      setActionError(errorMessage(error));
      setSaveStatus("idle");
      return false;
    } finally {
      inFlight.current = false;
    }
  }

  function retrySave() {
    if (latest.current) void savePreferences(latest.current);
  }

  return {
    preferences,
    loading,
    loadError,
    refreshError,
    actionError,
    saveStatus,
    retry,
    savePreferences,
    retrySave,
  };
}
