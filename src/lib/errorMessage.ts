import { NEEDS_CONNECTION, isNetworkFailureMessage } from "../domain/offlineWording";

// A readable message for an error. A failure to reach the server reads
// "You'll need to be online to do this." rather than "AbortError: …" or
// "TypeError: Failed to fetch" (PWA phase 2, decision B3).
export function errorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    const message = (error as { message: string }).message;
    return isNetworkFailureMessage(message) ? NEEDS_CONNECTION : message;
  }
  return String(error);
}

// A background refresh failed while the screen shows its last-known copy
// (instant screens, I3): the content stays, with this above it.
export const REFRESH_FAILED = "Couldn’t refresh. What’s shown may be out of date.";

