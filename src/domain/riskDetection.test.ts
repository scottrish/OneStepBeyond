import { describe, expect, it } from "vitest";
import { assignmentsNeedingAttention } from "./riskDetection";
import type { Assignment } from "../services/assignmentService";
import type { WorkItem } from "../services/workItemService";
import type { WorkSession } from "../services/workSessionService";
import type { Activity } from "../services/activityService";
import type { Preferences } from "../services/preferencesService";

// 2026-03-16 is a Monday — every date used below stays on weekdays so
// the weekday study window (15:15-21:00, 345 min, minus 90 protected =
// 255 min/day with no Activities and nothing else planned) is constant
// across every test, making the arithmetic in each scenario predictable.
const TODAY = "2026-03-16";
const NOT_ENOUGH_TIME_MESSAGE =
  "There is more work left here than time before it is due. Worth replanning together.";
const DUE_SOON_UNSCHEDULED_MESSAGE = "Due soon and nothing planned for it yet.";

function assignment(overrides: Partial<Assignment> = {}): Assignment {
  return {
    id: "a1",
    courseId: "course-1",
    title: "Essay",
    dueDate: "2026-03-21",
    effortMinutes: 60,
    notes: null,
    completedAt: null,
    ...overrides,
  };
}

function workItem(overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    id: "w1",
    assignmentId: "a1",
    title: "Draft outline",
    effortMinutes: 60,
    completedAt: null,
    position: 0,
    ...overrides,
  };
}

function workSession(overrides: Partial<WorkSession> = {}): WorkSession {
  return {
    id: "s1",
    workItemId: "w1",
    date: TODAY,
    plannedMinutes: 30,
    startTime: null,
    status: "planned",
    ...overrides,
  };
}

const noActivities: Activity[] = [];
const preferences: Preferences = { weekdayFinishTime: "21:00", weekendHours: 10 };

describe("assignmentsNeedingAttention", () => {
  it("stays silent when there's a breakdown, enough capacity, and a session already scheduled", () => {
    const results = assignmentsNeedingAttention(
      [assignment({ dueDate: "2026-03-17", effortMinutes: 30 })],
      [workItem({ effortMinutes: 30 })],
      [workSession({ date: TODAY })],
      noActivities,
      TODAY,
      preferences,
    );

    expect(results).toEqual([]);
  });

  it("flags rule 1 (not enough time) for an assignment with no Work Items, due far enough out that scheduling isn't 'soon'", () => {
    // Due in 4 days, 2026-03-20 — a Friday, so every day from today
    // through the due date stays a weekday (not "due soon" either,
    // rule 2's own <=2-day window): capacity = 255 * 5 weekdays = 1275.
    const results = assignmentsNeedingAttention(
      [assignment({ dueDate: "2026-03-20", effortMinutes: 1300 })],
      [],
      [],
      noActivities,
      TODAY,
      preferences,
    );

    expect(results).toEqual([
      {
        assignment: assignment({ dueDate: "2026-03-20", effortMinutes: 1300 }),
        message: NOT_ENOUGH_TIME_MESSAGE,
        action: "break-it-down",
      },
    ]);
  });

  it("flags rule 2 (due soon, unscheduled) for an assignment with no Work Items", () => {
    const results = assignmentsNeedingAttention(
      [assignment({ dueDate: "2026-03-17", effortMinutes: 30 })],
      [],
      [],
      noActivities,
      TODAY,
      preferences,
    );

    expect(results).toEqual([
      {
        assignment: assignment({ dueDate: "2026-03-17", effortMinutes: 30 }),
        message: DUE_SOON_UNSCHEDULED_MESSAGE,
        action: "break-it-down",
      },
    ]);
  });

  it("action is 'find-time' when rule 2 fires and a breakdown already exists", () => {
    const results = assignmentsNeedingAttention(
      [assignment({ dueDate: "2026-03-17" })],
      [workItem({ effortMinutes: 30 })],
      [], // nothing scheduled for w1 at all
      noActivities,
      TODAY,
      preferences,
    );

    expect(results).toEqual([
      {
        assignment: assignment({ dueDate: "2026-03-17" }),
        message: DUE_SOON_UNSCHEDULED_MESSAGE,
        action: "find-time",
      },
    ]);
  });

  it("action is 'make-a-plan' when rule 1 fires and a breakdown already exists", () => {
    const results = assignmentsNeedingAttention(
      [assignment({ dueDate: "2026-03-20" })], // Friday, still all-weekday
      [workItem({ effortMinutes: 1300 })],
      [],
      noActivities,
      TODAY,
      preferences,
    );

    expect(results).toEqual([
      {
        assignment: assignment({ dueDate: "2026-03-20" }),
        message: NOT_ENOUGH_TIME_MESSAGE,
        action: "make-a-plan",
      },
    ]);
  });

  it("a scheduled future session on the work item satisfies rule 2, even if it's on a different day than today", () => {
    const results = assignmentsNeedingAttention(
      [assignment({ dueDate: "2026-03-17", effortMinutes: 30 })],
      [workItem({ effortMinutes: 30 })],
      [workSession({ date: "2026-03-17", status: "planned" })],
      noActivities,
      TODAY,
      preferences,
    );

    expect(results).toEqual([]);
  });

  it("a session for a different work item does not satisfy rule 2", () => {
    const results = assignmentsNeedingAttention(
      [assignment({ dueDate: "2026-03-17" })],
      [workItem({ id: "w1", effortMinutes: 30 })],
      [workSession({ workItemId: "w-other", date: TODAY })],
      noActivities,
      TODAY,
      preferences,
    );

    expect(results[0]?.action).toBe("find-time");
  });

  it("a done session does not satisfy rule 2 — it's no longer a future commitment", () => {
    const results = assignmentsNeedingAttention(
      [assignment({ dueDate: "2026-03-17" })],
      [workItem({ effortMinutes: 30 })],
      [workSession({ date: TODAY, status: "done" })],
      noActivities,
      TODAY,
      preferences,
    );

    expect(results[0]?.action).toBe("find-time");
  });

  it("a session dated before today does not count as a future commitment", () => {
    const results = assignmentsNeedingAttention(
      [assignment({ dueDate: "2026-03-17" })],
      [workItem({ effortMinutes: 30 })],
      [workSession({ date: "2026-03-10" })],
      noActivities,
      TODAY,
      preferences,
    );

    expect(results[0]?.action).toBe("find-time");
  });

  it("never flags an assignment whose Work Items are all done, even if the assignment record itself is still open", () => {
    // Completing every session for the day (Today Execution) completes
    // each session's Work Item but doesn't itself mark the assignment
    // complete — the exact state that used to trip rule 2, since
    // hasFutureSession only inspects *open* items and vacuously found
    // none once every item was done.
    const results = assignmentsNeedingAttention(
      [assignment({ dueDate: "2026-03-17", effortMinutes: 30 })],
      [workItem({ effortMinutes: 30, completedAt: "2026-03-16T12:00:00Z" })],
      [workSession({ date: TODAY, status: "done" })],
      noActivities,
      TODAY,
      preferences,
    );

    expect(results).toEqual([]);
  });

  it("never flags a completed assignment", () => {
    const results = assignmentsNeedingAttention(
      [assignment({ completedAt: "2026-03-15T00:00:00Z", effortMinutes: 10000 })],
      [],
      [],
      noActivities,
      TODAY,
      preferences,
    );

    expect(results).toEqual([]);
  });

  it("never flags an assignment whose due date has already passed", () => {
    const results = assignmentsNeedingAttention(
      [assignment({ dueDate: "2026-03-10", effortMinutes: 10000 })],
      [],
      [],
      noActivities,
      TODAY,
      preferences,
    );

    expect(results).toEqual([]);
  });

  it("sorts flagged assignments soonest-due-first", () => {
    const results = assignmentsNeedingAttention(
      [
        assignment({ id: "later", dueDate: "2026-03-20", effortMinutes: 1300 }),
        assignment({ id: "sooner", dueDate: "2026-03-17", effortMinutes: 30 }),
      ],
      [],
      [],
      noActivities,
      TODAY,
      preferences,
    );

    expect(results.map((r) => r.assignment.id)).toEqual(["sooner", "later"]);
  });

  it("never includes any minutes/percentage figures in the message text (Domain Invariant 11)", () => {
    const results = assignmentsNeedingAttention(
      [assignment({ dueDate: "2026-03-17", effortMinutes: 30 })],
      [],
      [],
      noActivities,
      TODAY,
      preferences,
    );

    expect(results[0]?.message).not.toMatch(/\d/);
  });
});
