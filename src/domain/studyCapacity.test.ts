import { describe, expect, it } from "vitest";
import {
  activitiesOn,
  availableMinutes,
  capacityPhrase,
  minutesBetween,
  stepWeekendHours,
  studySlots,
  weekendHoursLabel,
} from "./studyCapacity";
import type { Activity } from "../services/activityService";
import type { Preferences } from "../services/preferencesService";

// 2026-03-16 is a Monday (weekday); 2026-03-15 is a Sunday and
// 2026-03-14 a Saturday.
const WEEKDAY = "2026-03-16";
const WEEKEND = "2026-03-15";
const SATURDAY = "2026-03-14";

// 345 min on a weekday (15:15-21:00); Saturday 4h, Sunday 10h, so the
// two weekend days are distinguishable in every expectation below.
const preferences: Preferences = { weekdayFinishTime: "21:00", saturdayHours: 4, sundayHours: 10 };

function activity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "a1",
    name: "Football practice",
    days: [1],
    startTime: "17:00",
    finishTime: "18:30",
    travelToMinutes: 15,
    travelFromMinutes: 15,
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
  it("uses the fixed 15:15 start through the configured weekday finish time (345 min) when there are no activities, with no protected buffer", () => {
    expect(availableMinutes([], [], WEEKDAY, preferences)).toBe(345);
  });

  it("uses Sunday's own budget on a Sunday (10h = 600 min), with no protected buffer", () => {
    expect(availableMinutes([], [], WEEKEND, preferences)).toBe(600);
  });

  it("uses Saturday's own budget on a Saturday (4h = 240 min), never Sunday's", () => {
    expect(availableMinutes([], [], SATURDAY, preferences)).toBe(240);
  });

  it("a weekend day set to 0 hours has no study time", () => {
    expect(availableMinutes([], [], SATURDAY, { ...preferences, saturdayHours: 0 })).toBe(0);
  });

  it("a custom weekday finish time changes the total directly", () => {
    // Fixed 15:15 start through a 19:00 finish = 225 min.
    const shorterEvening: Preferences = { ...preferences, weekdayFinishTime: "19:00" };
    expect(availableMinutes([], [], WEEKDAY, shorterEvening)).toBe(225);
  });

  it("a custom Sunday budget changes Sunday directly, independent of weekday and Saturday", () => {
    const fewerWeekendHours: Preferences = { ...preferences, sundayHours: 3 };
    expect(availableMinutes([], [], WEEKEND, fewerWeekendHours)).toBe(180);
    // Weekday and Saturday are untouched by the Sunday-only change.
    expect(availableMinutes([], [], WEEKDAY, fewerWeekendHours)).toBe(345);
    expect(availableMinutes([], [], SATURDAY, fewerWeekendHours)).toBe(240);
  });

  it("subtracts an activity's duration plus its travel time both ways", () => {
    // 17:00-18:30 = 90 min + 15 min there + 15 min back = 120 min busy.
    const result = availableMinutes([activity()], [], WEEKDAY, preferences);
    expect(result).toBe(345 - 120);
  });

  it("subtracts travel-to and travel-from independently, even when only one side has any", () => {
    // 17:00-18:30 = 90 min + 20 min there + 0 min back = 110 min busy.
    const oneWayOnly = activity({ travelToMinutes: 20, travelFromMinutes: 0 });
    const result = availableMinutes([oneWayOnly], [], WEEKDAY, preferences);
    expect(result).toBe(345 - 110);
  });

  it("ignores activities on a different day", () => {
    const tuesdayOnly = activity({ days: [2] });
    expect(availableMinutes([tuesdayOnly], [], WEEKDAY, preferences)).toBe(345);
  });

  it("subtracts minutes already planned (and not done) for that date", () => {
    const result = availableMinutes(
      [],
      [
        { date: WEEKDAY, status: "planned", plannedMinutes: 40 },
        { date: WEEKDAY, status: "in_progress", plannedMinutes: 20 },
      ],
      WEEKDAY,
      preferences,
    );
    expect(result).toBe(345 - 60);
  });

  it("does not subtract done sessions", () => {
    const result = availableMinutes(
      [],
      [{ date: WEEKDAY, status: "done", plannedMinutes: 999 }],
      WEEKDAY,
      preferences,
    );
    expect(result).toBe(345);
  });

  it("ignores sessions on a different date", () => {
    const result = availableMinutes(
      [],
      [{ date: "2026-03-17", status: "planned", plannedMinutes: 999 }],
      WEEKDAY,
      preferences,
    );
    expect(result).toBe(345);
  });

  it("never goes below zero", () => {
    const allDay = activity({
      startTime: "00:00",
      finishTime: "23:59",
      travelToMinutes: 0,
      travelFromMinutes: 0,
    });
    expect(availableMinutes([allDay], [], WEEKDAY, preferences)).toBe(0);
  });
});

describe("studySlots", () => {
  it("returns one slot spanning the whole window when there are no activities", () => {
    const slots = studySlots([], WEEKDAY, preferences);
    expect(slots).toEqual([
      { start: "15:15", finish: "21:00", minutes: 345, label: "After school" },
    ]);
  });

  it("a custom weekday finish time changes the window's end", () => {
    const shorterEvening: Preferences = { ...preferences, weekdayFinishTime: "19:00" };
    const slots = studySlots([], WEEKDAY, shorterEvening);
    expect(slots).toEqual([
      { start: "15:15", finish: "19:00", minutes: 225, label: "After school" },
    ]);
  });

  it("splits into before/after slots around a single activity, accounting for travel", () => {
    const slots = studySlots([activity()], WEEKDAY, preferences);
    // Activity 17:00-18:30 with 15 min travel each side -> busy 16:45-18:45.
    expect(slots).toEqual([
      { start: "15:15", finish: "16:45", minutes: 90, label: "Before football practice" },
      { start: "18:45", finish: "21:00", minutes: 135, label: "After football practice" },
    ]);
  });

  it("applies travel-to and travel-from independently — no travel-to blocks nothing before start", () => {
    // Starts right after school, at school: no travel-to, 20 min travel-from.
    // Activity 17:00-18:30 -> busy 17:00-18:50.
    const noTravelTo = activity({ travelToMinutes: 0, travelFromMinutes: 20 });
    const slots = studySlots([noTravelTo], WEEKDAY, preferences);
    expect(slots).toEqual([
      { start: "15:15", finish: "17:00", minutes: 105, label: "Before football practice" },
      { start: "18:50", finish: "21:00", minutes: 130, label: "After football practice" },
    ]);
  });

  it("omits stretches shorter than 20 minutes on both sides", () => {
    // Leaves only a 5 min gap before (15:15-15:20) and a 10 min gap
    // after (20:50-21:00) — both too short to offer as a slot.
    const almostAllDay = activity({
      startTime: "15:20",
      finishTime: "20:50",
      travelToMinutes: 0,
      travelFromMinutes: 0,
    });
    expect(studySlots([almostAllDay], WEEKDAY, preferences)).toEqual([]);
  });

  // docs/features/student-preferences.md's Design Decisions: weekend is a
  // plain hours budget, not a time window — there's no clock-time anchor
  // to carve suggested stretches from, so this returns nothing rather
  // than inventing one. The Schedule step's manual time input already
  // renders regardless of whether any slots exist.
  it("returns no suggested slots for a weekend date, regardless of Activities", () => {
    expect(studySlots([], WEEKEND, preferences)).toEqual([]);
    expect(studySlots([activity({ days: [0] })], WEEKEND, preferences)).toEqual([]);
  });
});

describe("capacityPhrase", () => {
  it("returns 'No study time today' at and below zero", () => {
    expect(capacityPhrase(0)).toBe("No study time today");
    expect(capacityPhrase(-10)).toBe("No study time today");
  });

  it("returns 'Tight day' just above zero and just under 45", () => {
    expect(capacityPhrase(1)).toBe("Tight day");
    expect(capacityPhrase(44)).toBe("Tight day");
  });

  it("returns a figure rounded to the nearest 30 minutes from 45 up to just under 120", () => {
    expect(capacityPhrase(45)).toBe("About 60 min study time available");
    expect(capacityPhrase(119)).toBe("About 120 min study time available");
  });

  it("returns 'About 2 hr study time available' from 120 up to just under 210", () => {
    expect(capacityPhrase(120)).toBe("About 2 hr study time available");
    expect(capacityPhrase(209)).toBe("About 2 hr study time available");
  });

  it("returns 'Mostly open' from 210 up to just under 300", () => {
    expect(capacityPhrase(210)).toBe("Mostly open");
    expect(capacityPhrase(299)).toBe("Mostly open");
  });

  it("returns 'Plenty of room' at and above 300", () => {
    expect(capacityPhrase(300)).toBe("Plenty of room");
    expect(capacityPhrase(600)).toBe("Plenty of room");
  });
});

describe("stepWeekendHours", () => {
  it("moves in half-hour steps", () => {
    expect(stepWeekendHours(2, 0.5)).toBe(2.5);
    expect(stepWeekendHours(2.5, -0.5)).toBe(2);
  });

  it("clamps to 0 and 8", () => {
    expect(stepWeekendHours(0, -0.5)).toBe(0);
    expect(stepWeekendHours(8, 0.5)).toBe(8);
  });
});

describe("weekendHoursLabel", () => {
  it("describes the budget in words", () => {
    expect(weekendHoursLabel(0)).toBe("No study time");
    expect(weekendHoursLabel(1)).toBe("1 hour");
    expect(weekendHoursLabel(0.5)).toBe("0.5 hours");
    expect(weekendHoursLabel(2.5)).toBe("2.5 hours");
  });
});
