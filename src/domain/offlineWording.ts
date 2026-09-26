// How the offline line says when the plan on screen is from (PWA phase 2,
// 2b — docs/features/pwa-phase-2-offline-v0.1.md, question 3): "2:15 PM",
// "yesterday at 2:15 PM", "Tuesday at 2:15 PM", or a date beyond a week.

function clock(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function savedAtLabel(savedAtIso: string, now: Date): string {
  const saved = new Date(savedAtIso);
  const days = Math.round((startOfDay(now) - startOfDay(saved)) / 86_400_000);
  if (days <= 0) return clock(saved);
  if (days === 1) return `yesterday at ${clock(saved)}`;
  if (days < 7) return `${saved.toLocaleDateString("en-US", { weekday: "long" })} at ${clock(saved)}`;
  return saved.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function offlineLine(savedAtIso: string, now: Date): string {
  return `You’re offline. Showing your plan from ${savedAtLabel(savedAtIso, now)}.`;
}

// What any action says when it can't reach the server (decision B3) —
// never a raw "AbortError" or "Failed to fetch".
export const NEEDS_CONNECTION = "You’ll need to be online to do this.";

const NETWORK_FAILURE =
  /You're offline\.|Failed to fetch|Load failed|NetworkError when attempting to fetch|ERR_INTERNET_DISCONNECTED/;

export function isNetworkFailureMessage(message: string): boolean {
  return NETWORK_FAILURE.test(message);
}
