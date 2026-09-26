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

// ——— Changes made offline (2c, questions 2–4) ———

export const QUEUED_NOTE = "Changes will be saved when you’re back online.";

export const CONFLICT_NOTE =
  "Some changes from while you were offline didn’t apply, because the plan changed on another device.";

export function waitingLabel(count: number): string {
  return count === 1 ? "1 change waiting to be saved" : `${count} changes waiting to be saved`;
}

// Never "failed" or "error" (question 3): it's still kept, and can be sent again.
export const STUCK_NOTE = "One change hasn’t gone through yet.";

export const SIGN_OUT_WARNING = "You have changes that haven’t been saved yet. Signing out will lose them.";
