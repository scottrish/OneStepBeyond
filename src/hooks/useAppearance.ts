import { useSyncExternalStore } from "react";
import { getAppearance, setAppearance, subscribeAppearance } from "../lib/appearanceStore";
import type { AppearanceChoice } from "../domain/appearance";

// The student's light/dark choice, and a way to change it (applied at once).
export function useAppearance(): [AppearanceChoice, (choice: AppearanceChoice) => void] {
  const choice = useSyncExternalStore(subscribeAppearance, getAppearance, getAppearance);
  return [choice, setAppearance];
}
