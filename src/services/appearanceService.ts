import { isAppearanceChoice, type AppearanceChoice } from "../domain/appearance";

// Where the light/dark choice is kept: this device's browser storage, not
// the student's account, so it can be applied before sign-in and before
// any data loads — no flash of the wrong colours (docs/features/
// appearance-light-dark-v0.1.md, A1). index.html's inline script reads the
// same key before the first paint.
export const APPEARANCE_STORAGE_KEY = "osb-appearance";

/** The saved choice, or "Match my device" if none (or storage is blocked). */
export function readAppearance(): AppearanceChoice {
  try {
    const saved = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    return isAppearanceChoice(saved) ? saved : "system";
  } catch {
    return "system";
  }
}

/** Saves the choice. If storage is blocked it still applies for this visit. */
export function saveAppearance(choice: AppearanceChoice): void {
  try {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, choice);
  } catch {
    // A comfort setting: no error for the student.
  }
}
