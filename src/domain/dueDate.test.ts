import { describe, expect, it } from "vitest";
import { formatDueDate, tomorrowDateString } from "./dueDate";

describe("tomorrowDateString", () => {
  it("returns the day after the reference date", () => {
    expect(tomorrowDateString(new Date(2026, 2, 14))).toBe("2026-03-15");
  });

  it("rolls over to the next month correctly", () => {
    expect(tomorrowDateString(new Date(2026, 1, 28))).toBe("2026-03-01");
  });

  it("rolls over to the next year correctly", () => {
    expect(tomorrowDateString(new Date(2026, 11, 31))).toBe("2027-01-01");
  });

  it("pads single-digit months and days", () => {
    expect(tomorrowDateString(new Date(2026, 0, 8))).toBe("2026-01-09");
  });
});

describe("formatDueDate", () => {
  it("formats a date string as a readable long date", () => {
    expect(formatDueDate("2026-03-15")).toBe("March 15, 2026");
  });

  it("does not shift the day near a UTC midnight boundary", () => {
    // A naive `new Date("2026-01-01")` interprets the string as UTC
    // midnight, which formats as December 31 in negative-UTC-offset
    // timezones — this must stay January 1 regardless of local timezone.
    expect(formatDueDate("2026-01-01")).toBe("January 1, 2026");
  });
});
