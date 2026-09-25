import { describe, expect, it } from "vitest";
import { startTimePassed } from "./lateStart";

const at = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h! * 60 + m!;
};

describe("startTimePassed", () => {
  const planned = { status: "planned" as const, startTime: "16:00" };

  it("is true for a planned session more than 45 minutes past its start", () => {
    expect(startTimePassed(planned, at("16:46"))).toBe(true);
  });

  it("is false within 45 minutes of the start, including exactly 45", () => {
    expect(startTimePassed(planned, at("16:30"))).toBe(false);
    expect(startTimePassed(planned, at("16:45"))).toBe(false);
  });

  it("is false before the start time", () => {
    expect(startTimePassed(planned, at("15:00"))).toBe(false);
  });

  it("is false once the session has started or is done", () => {
    expect(startTimePassed({ ...planned, status: "in_progress" }, at("18:00"))).toBe(false);
    expect(startTimePassed({ ...planned, status: "done" }, at("18:00"))).toBe(false);
  });

  it("is false for a session with no start time", () => {
    expect(startTimePassed({ status: "planned", startTime: null }, at("23:00"))).toBe(false);
  });

  it("reads a database-style HH:MM:SS start time", () => {
    expect(startTimePassed({ status: "planned", startTime: "16:00:00" }, at("17:00"))).toBe(true);
  });
});
