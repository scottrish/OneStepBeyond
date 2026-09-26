import { describe, expect, it } from "vitest";
import { estimateLabel, otherOpenSessionsFor, revisedEstimate } from "./executionTiming";

describe("revisedEstimate", () => {
  it("adds the extra minutes and keeps what it replaced, the first time", () => {
    expect(revisedEstimate({ plannedMinutes: 30 }, 10)).toEqual({
      plannedMinutes: 40,
      originalPlannedMinutes: 30,
    });
  });

  it("keeps the first original on later revisions", () => {
    expect(revisedEstimate({ plannedMinutes: 40, originalPlannedMinutes: 30 }, 10)).toEqual({
      plannedMinutes: 50,
      originalPlannedMinutes: 30,
    });
  });
});

describe("estimateLabel", () => {
  it("is just the estimate until it's revised", () => {
    expect(estimateLabel({ plannedMinutes: 30 })).toBe("30m");
    expect(estimateLabel({ plannedMinutes: 30, originalPlannedMinutes: null })).toBe("30m");
    expect(estimateLabel({ plannedMinutes: 30, originalPlannedMinutes: 30 })).toBe("30m");
  });

  it("shows the current number with the original alongside, once revised", () => {
    expect(estimateLabel({ plannedMinutes: 40, originalPlannedMinutes: 30 })).toBe(
      "about 40m · first planned 30m",
    );
  });
});

describe("otherOpenSessionsFor", () => {
  const session = (id: string, workItemId: string, date: string, status: "planned" | "in_progress" | "done" = "planned") => ({
    id,
    workItemId,
    date,
    status,
  });

  it("finds the same step's other not-done sessions, soonest first", () => {
    const current = session("s1", "w1", "2026-03-16", "in_progress");
    const all = [
      current,
      session("s3", "w1", "2026-03-19"),
      session("s2", "w1", "2026-03-17", "in_progress"),
      session("s4", "w1", "2026-03-18", "done"),
      session("s5", "w2", "2026-03-17"),
    ];
    expect(otherOpenSessionsFor(current, all).map((s) => s.id)).toEqual(["s2", "s3"]);
  });

  it("is empty when this is the step's only open session", () => {
    const current = session("s1", "w1", "2026-03-16", "in_progress");
    expect(otherOpenSessionsFor(current, [current, session("s4", "w1", "2026-03-18", "done")])).toEqual([]);
  });
});
