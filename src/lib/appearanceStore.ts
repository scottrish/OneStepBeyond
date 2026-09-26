import { THEME_COLORS, resolveScheme, type AppearanceChoice } from "../domain/appearance";
import { readAppearance, saveAppearance } from "../services/appearanceService";

// Applies the light/dark choice to the page and keeps "Match my device"
// following the device while the app is open (docs/features/
// appearance-light-dark-v0.1.md). The first paint is already right —
// index.html's inline script does the same before any CSS applies; this
// takes over once the app has loaded.

let current: AppearanceChoice | null = null;
const listeners = new Set<() => void>();

function deviceQuery(): MediaQueryList | null {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;
}

function apply(choice: AppearanceChoice) {
  const scheme = resolveScheme(choice, deviceQuery()?.matches ?? false);
  const root = document.documentElement;
  root.dataset.theme = scheme;
  root.style.colorScheme = scheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[scheme]);
}

export function getAppearance(): AppearanceChoice {
  return current ?? readAppearance();
}

export function setAppearance(choice: AppearanceChoice): void {
  current = choice;
  saveAppearance(choice);
  apply(choice);
  listeners.forEach((listener) => listener());
}

export function subscribeAppearance(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Once, at startup: apply the saved choice and follow device changes. */
export function initAppearance(): void {
  apply(getAppearance());
  deviceQuery()?.addEventListener("change", () => {
    if (getAppearance() === "system") apply("system");
  });
}
