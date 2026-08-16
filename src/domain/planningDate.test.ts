import { describe, expect, it } from "vitest";
import {
  addDaysISODate,
  dayLabel,
  dayOfWeek,
  dueRelativeLabel,
  longPlanDate,
  shortDayLabel,
  todayISODate,
} from "./planningDate";

describe("todayISODate", () => {
  it("formats the reference date as YYYY-MM-DD", () => {
    expect(todayISODate(new Date(2026, 2, 15))).toBe("2026-03-15");
  });

  it("pads single-digit months and days", () => {
    expect(todayISODate(new Date(2026, 0, 8))).toBe("2026-01-08");
  });
});

describe("addDaysISODate", () => {
  it("adds days within the same month", () => {
    expect(addDaysISODate("2026-03-15", 3)).toBe("2026-03-18");
  });

  it("rolls over to the next month", () => {
    expect(addDaysISODate("2026-02-27", 3)).toBe("2026-03-02");
  });

  it("rolls over to the next year", () => {
    expect(addDaysISODate("2026-12-30", 3)).toBe("2027-01-02");
  });
});

describe("dayOfWeek", () => {
  it("returns 0 for Sunday and 6 for Saturday", () => {
    expect(dayOfWeek("2026-03-15")).toBe(0); // Sunday
    expect(dayOfWeek("2026-03-21")).toBe(6); // Saturday
  });
});

describe("dayLabel", () => {
  it("returns 'today' when the date matches today", () => {
    expect(dayLabel("2026-03-15", "2026-03-15")).toBe("today");
  });

  it("returns the full weekday name otherwise", () => {
    expect(dayLabel("2026-03-16", "2026-03-15")).toBe("Monday");
  });
});

describe("shortDayLabel", () => {
  it("returns 'Today' when the date matches today", () => {
    expect(shortDayLabel("2026-03-15", "2026-03-15")).toBe("Today");
  });

  it("returns a short weekday name otherwise", () => {
    expect(shortDayLabel("2026-03-16", "2026-03-15")).toBe("Mon");
  });
});

describe("longPlanDate", () => {
  it("formats with weekday, month and day but no year", () => {
    expect(longPlanDate("2026-03-16")).toBe("Monday, March 16");
  });

  it("does not shift the day near a UTC midnight boundary", () => {
    expect(longPlanDate("2026-01-01")).toBe("Thursday, January 1");
  });
});

describe("dueRelativeLabel", () => {
  it("returns 'Due today' for the reference date itself", () => {
    expect(dueRelativeLabel("2026-03-15", "2026-03-15")).toBe("Due today");
  });

  it("returns 'Due tomorrow' one day out", () => {
    expect(dueRelativeLabel("2026-03-16", "2026-03-15")).toBe("Due tomorrow");
  });

  it("returns a weekday name within the next week", () => {
    expect(dueRelativeLabel("2026-03-19", "2026-03-15")).toBe("Due Thursday");
  });

  it("returns a short month/day beyond a week out", () => {
    expect(dueRelativeLabel("2026-03-25", "2026-03-15")).toBe("Due Mar 25");
  });

  it("returns 'Due yesterday' one day overdue", () => {
    expect(dueRelativeLabel("2026-03-14", "2026-03-15")).toBe("Due yesterday");
  });

  it("returns 'Due N days ago' further overdue", () => {
    expect(dueRelativeLabel("2026-03-10", "2026-03-15")).toBe("Due 5 days ago");
  });
});
