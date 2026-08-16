import { describe, expect, it } from "vitest";
import {
  PROTECTED_MINUTES,
  activitiesOn,
  availableMinutes,
  minutesBetween,
  studySlots,
} from "./studyCapacity";
import type { Activity } from "../services/activityService";

// 2026-03-16 is a Monday (weekday); 2026-03-15 is a Sunday (weekend).
const WEEKDAY = "2026-03-16";
const WEEKEND = "2026-03-15";

function activity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "a1",
    name: "Football practice",
    days: [1],
    startTime: "17:00",
    finishTime: "18:30",
    travelMinutes: 15,
    ...overrides,
  };
}

describe("minutesBetween", () => {
  it("returns the minute difference between two times", () => {
    expect(minutesBetween("15:15", "21:00")).toBe(345);
  });
});

describe("activitiesOn", () => {
  it("returns only activities scheduled on that date's day of week", () => {
    const monday = activity({ days: [1] });
    const saturday = activity({ id: "a2", days: [6] });

    expect(activitiesOn([monday, saturday], WEEKDAY)).toEqual([monday]);
  });
});

describe("availableMinutes", () => {
  it("uses the full weekday window (15:15-21:00 = 345 min) minus the protected block when there are no activities", () => {
    expect(availableMinutes([], [], WEEKDAY)).toBe(345 - PROTECTED_MINUTES);
  });

  it("uses the weekend window (10:00-20:00 = 600 min) minus the protected block when there are no activities", () => {
    expect(availableMinutes([], [], WEEKEND)).toBe(600 - PROTECTED_MINUTES);
  });

  it("subtracts an activity's duration plus its travel time", () => {
    // 17:00-18:30 = 90 min + 15 min travel = 105 min busy.
    const result = availableMinutes([activity()], [], WEEKDAY);
    expect(result).toBe(345 - PROTECTED_MINUTES - 105);
  });

  it("ignores activities on a different day", () => {
    const tuesdayOnly = activity({ days: [2] });
    expect(availableMinutes([tuesdayOnly], [], WEEKDAY)).toBe(345 - PROTECTED_MINUTES);
  });

  it("subtracts minutes already planned (and not done) for that date", () => {
    const result = availableMinutes(
      [],
      [
        { date: WEEKDAY, status: "planned", plannedMinutes: 40 },
        { date: WEEKDAY, status: "in_progress", plannedMinutes: 20 },
      ],
      WEEKDAY,
    );
    expect(result).toBe(345 - PROTECTED_MINUTES - 60);
  });

  it("does not subtract done sessions", () => {
    const result = availableMinutes(
      [],
      [{ date: WEEKDAY, status: "done", plannedMinutes: 999 }],
      WEEKDAY,
    );
    expect(result).toBe(345 - PROTECTED_MINUTES);
  });

  it("ignores sessions on a different date", () => {
    const result = availableMinutes(
      [],
      [{ date: "2026-03-17", status: "planned", plannedMinutes: 999 }],
      WEEKDAY,
    );
    expect(result).toBe(345 - PROTECTED_MINUTES);
  });

  it("never goes below zero", () => {
    const allDay = activity({ startTime: "00:00", finishTime: "23:59", travelMinutes: 0 });
    expect(availableMinutes([allDay], [], WEEKDAY)).toBe(0);
  });
});

describe("studySlots", () => {
  it("returns one slot spanning the whole window when there are no activities", () => {
    const slots = studySlots([], WEEKDAY);
    expect(slots).toEqual([
      { start: "15:15", finish: "21:00", minutes: 345, label: "After school" },
    ]);
  });

  it("splits into before/after slots around a single activity, accounting for travel", () => {
    const slots = studySlots([activity()], WEEKDAY);
    // Activity 17:00-18:30 with 15 min travel each side -> busy 16:45-18:45.
    expect(slots).toEqual([
      { start: "15:15", finish: "16:45", minutes: 90, label: "Before football practice" },
      { start: "18:45", finish: "21:00", minutes: 135, label: "After football practice" },
    ]);
  });

  it("omits stretches shorter than 20 minutes on both sides", () => {
    // Leaves only a 5 min gap before (15:15-15:20) and a 10 min gap
    // after (20:50-21:00) — both too short to offer as a slot.
    const almostAllDay = activity({
      startTime: "15:20",
      finishTime: "20:50",
      travelMinutes: 0,
    });
    expect(studySlots([almostAllDay], WEEKDAY)).toEqual([]);
  });

  it("uses the weekend window and a 'Morning' label for the first slot", () => {
    const slots = studySlots([], WEEKEND);
    expect(slots).toEqual([
      { start: "10:00", finish: "20:00", minutes: 600, label: "Morning" },
    ]);
  });
});
