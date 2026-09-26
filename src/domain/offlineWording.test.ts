import { describe, expect, it } from "vitest";
import { NEEDS_CONNECTION, isNetworkFailureMessage, offlineLine, savedAtLabel } from "./offlineWording";
import { errorMessage } from "../lib/errorMessage";

const now = new Date(2026, 8, 26, 16, 0); // Saturday 26 Sep 2026, 4 PM

describe("savedAtLabel", () => {
  it("today: just the time", () => {
    expect(savedAtLabel(new Date(2026, 8, 26, 14, 15).toISOString(), now)).toBe("2:15 PM");
  });

  it("yesterday, then a weekday, then a date", () => {
    expect(savedAtLabel(new Date(2026, 8, 25, 21, 5).toISOString(), now)).toBe("yesterday at 9:05 PM");
    expect(savedAtLabel(new Date(2026, 8, 22, 8, 0).toISOString(), now)).toBe("Tuesday at 8:00 AM");
    expect(savedAtLabel(new Date(2026, 8, 18, 8, 0).toISOString(), now)).toBe("Sep 18");
  });

  it("the whole line", () => {
    expect(offlineLine(new Date(2026, 8, 26, 14, 15).toISOString(), now)).toBe(
      "You’re offline. Showing your plan from 2:15 PM.",
    );
  });
});

describe("network failures in messages (decision B3)", () => {
  it("recognises the ways a failed connection shows up", () => {
    expect(isNetworkFailureMessage("AbortError: You're offline.")).toBe(true);
    expect(isNetworkFailureMessage("TypeError: Failed to fetch")).toBe(true);
    expect(isNetworkFailureMessage("TypeError: Load failed")).toBe(true);
    expect(isNetworkFailureMessage("permission denied for table")).toBe(false);
  });

  it("errorMessage says an action needs a connection, not 'AbortError'", () => {
    expect(errorMessage({ message: "AbortError: You're offline." })).toBe(NEEDS_CONNECTION);
    expect(errorMessage({ message: "TypeError: Failed to fetch" })).toBe("You’ll need to be online to do this.");
    expect(errorMessage({ message: "permission denied" })).toBe("permission denied");
  });
});
