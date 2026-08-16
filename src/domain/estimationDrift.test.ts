import { describe, expect, it } from "vitest";
import { estimationDrift } from "./estimationDrift";

describe("estimationDrift", () => {
  it("returns null when there are fewer than two done, measured sessions", () => {
    expect(estimationDrift([])).toBeNull();
    expect(
      estimationDrift([{ status: "done", plannedMinutes: 30, actualMinutes: 45 }]),
    ).toBeNull();
  });

  it("returns null when no session has ever been completed (this iteration's expected state)", () => {
    const sessions = [
      { status: "planned" as const, plannedMinutes: 30 },
      { status: "planned" as const, plannedMinutes: 20 },
    ];
    expect(estimationDrift(sessions)).toBeNull();
  });

  it("ignores done sessions with no recorded actualMinutes", () => {
    const sessions = [
      { status: "done" as const, plannedMinutes: 30, actualMinutes: 45 },
      { status: "done" as const, plannedMinutes: 20, actualMinutes: null },
    ];
    expect(estimationDrift(sessions)).toBeNull();
  });

  it("ignores non-done sessions even when planned/actual would be measurable", () => {
    const sessions = [
      { status: "done" as const, plannedMinutes: 30, actualMinutes: 45 },
      { status: "in_progress" as const, plannedMinutes: 20, actualMinutes: 40 },
    ];
    expect(estimationDrift(sessions)).toBeNull();
  });

  it("computes the ratio of actual to planned minutes across done sessions", () => {
    const sessions = [
      { status: "done" as const, plannedMinutes: 30, actualMinutes: 45 },
      { status: "done" as const, plannedMinutes: 20, actualMinutes: 25 },
    ];
    // (45 + 25) / (30 + 20) = 70 / 50 = 1.4
    expect(estimationDrift(sessions)).toBeCloseTo(1.4);
  });
});
