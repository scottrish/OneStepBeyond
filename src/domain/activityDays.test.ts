import { describe, expect, it } from "vitest";
import { isValidActivity } from "./activityDays";

const base = {
  name: "Football practice",
  days: [1, 2, 3, 4, 5],
  startTime: "15:30",
  finishTime: "17:00",
};

describe("isValidActivity", () => {
  it("is valid with a name, at least one day, and finish after start", () => {
    expect(isValidActivity(base)).toBe(true);
  });

  it("is invalid with a blank name", () => {
    expect(isValidActivity({ ...base, name: "   " })).toBe(false);
  });

  it("is invalid with no days selected", () => {
    expect(isValidActivity({ ...base, days: [] })).toBe(false);
  });

  it("is invalid when finish is not after start", () => {
    expect(isValidActivity({ ...base, startTime: "17:00", finishTime: "17:00" })).toBe(false);
    expect(isValidActivity({ ...base, startTime: "17:00", finishTime: "15:30" })).toBe(false);
  });
});
