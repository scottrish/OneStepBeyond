import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../services/workSessionService", () => ({
  listWorkSessionsForStudent: vi.fn(),
  deleteWorkSession: vi.fn(),
}));

import * as workSessionService from "../services/workSessionService";
import WeekLookAhead from "./WeekLookAhead";
import type { Preferences } from "../services/preferencesService";

const mockedWorkSessionService = workSessionService as unknown as {
  listWorkSessionsForStudent: ReturnType<typeof vi.fn>;
  deleteWorkSession: ReturnType<typeof vi.fn>;
};

// 2026-03-16 is a Monday, matching PlanPage.test.tsx's own convention.
const TODAY_ISO = "2026-03-16";

const preferences: Preferences = { weekdayFinishTime: "21:00", weekendHours: 10 };

function renderWeekLookAhead(overrides: Record<string, unknown> = {}) {
  return render(
    <WeekLookAhead
      studentId="student-1"
      activities={[]}
      assignments={[]}
      workItems={[]}
      preferences={preferences}
      today={TODAY_ISO}
      courseName={() => "Biology"}
      onPickDay={vi.fn()}
      onOpenAssignment={vi.fn()}
      {...overrides}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedWorkSessionService.listWorkSessionsForStudent.mockResolvedValue([]);
});

describe("WeekLookAhead", () => {
  it("shows the next seven days starting today", async () => {
    renderWeekLookAhead();

    expect(await screen.findByRole("button", { name: "Today" })).toBeInTheDocument();
    // 2026-03-22 is the seventh day (today + 6).
    expect(
      screen.getByRole("button", { name: /sunday, march 22/i }),
    ).toBeInTheDocument();
    // Not an eighth day.
    expect(
      screen.queryByRole("button", { name: /monday, march 23/i }),
    ).not.toBeInTheDocument();
  });

  it("tapping a date calls onPickDay with that date", async () => {
    const onPickDay = vi.fn();
    const userEventInstance = userEvent.setup();

    renderWeekLookAhead({ onPickDay });
    await userEventInstance.click(await screen.findByRole("button", { name: "Today" }));

    expect(onPickDay).toHaveBeenCalledWith(TODAY_ISO);
  });

  it("shows a qualitative capacity phrase, never a raw minutes/hours figure", async () => {
    renderWeekLookAhead();

    // No activities, full weekday window (15:15-21:00 = 345 min minus the
    // 90-min protected block = 255 min) -> "Mostly open" per capacityPhrase.
    expect(await screen.findAllByText("Mostly open")).not.toHaveLength(0);
    expect(screen.queryByText(/\d+\s*(min|hr)\s*free/i)).not.toBeInTheDocument();
  });

  it("shows what's due that day, linked to its Assignment", async () => {
    const onOpenAssignment = vi.fn();
    const userEventInstance = userEvent.setup();

    renderWeekLookAhead({
      assignments: [
        {
          id: "a1",
          courseId: "course-1",
          title: "Essay",
          dueDate: TODAY_ISO,
          effortMinutes: 60,
          notes: null,
          completedAt: null,
        },
      ],
      onOpenAssignment,
    });

    await userEventInstance.click(await screen.findByRole("button", { name: /due: essay/i }));
    expect(onOpenAssignment).toHaveBeenCalledWith("a1");
  });

  it("shows that day's Activities", async () => {
    renderWeekLookAhead({
      activities: [
        {
          id: "act-1",
          name: "Football practice",
          days: [1],
          startTime: "17:00",
          finishTime: "18:00",
          travelToMinutes: 0,
          travelFromMinutes: 0,
        },
      ],
    });

    expect(await screen.findByText(/football practice/i)).toBeInTheDocument();
  });

  it("shows already-planned sessions with completion state, and can remove a not-yet-done one", async () => {
    mockedWorkSessionService.listWorkSessionsForStudent.mockResolvedValue([
      {
        id: "s1",
        workItemId: "w1",
        date: TODAY_ISO,
        plannedMinutes: 30,
        startTime: "16:00",
        status: "planned",
      },
      {
        id: "s2",
        workItemId: "w2",
        date: TODAY_ISO,
        plannedMinutes: 30,
        startTime: "17:00",
        status: "done",
      },
    ]);
    mockedWorkSessionService.deleteWorkSession.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup();

    renderWeekLookAhead({
      workItems: [
        { id: "w1", assignmentId: "a1", title: "Draft outline", effortMinutes: 30, completedAt: null, position: 0 },
        { id: "w2", assignmentId: "a1", title: "Write conclusion", effortMinutes: 30, completedAt: "2026-03-16T00:00:00Z", position: 1 },
      ],
    });

    await screen.findByText("Draft outline");
    expect(screen.getByText("Write conclusion").parentElement).toHaveClass("line-through");
    // Only the not-done session gets a remove control.
    expect(
      screen.getByRole("button", { name: /remove draft outline/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /remove write conclusion/i }),
    ).not.toBeInTheDocument();

    await userEventInstance.click(screen.getByRole("button", { name: /remove draft outline/i }));
    expect(mockedWorkSessionService.deleteWorkSession).toHaveBeenCalledWith("s1");
  });

  it("shows each scheduled task's assignment and class, not just the step title", async () => {
    // docs/features/observations.md — scheduled tasks were identifiable
    // only by their own (often generic) step title, e.g. "Draft outline",
    // with no indication of which assignment or class it belonged to.
    mockedWorkSessionService.listWorkSessionsForStudent.mockResolvedValue([
      {
        id: "s1",
        workItemId: "w1",
        date: TODAY_ISO,
        plannedMinutes: 30,
        startTime: "16:00",
        status: "planned",
      },
    ]);

    renderWeekLookAhead({
      assignments: [
        {
          id: "a1",
          courseId: "course-1",
          title: "Essay",
          dueDate: "2026-03-20",
          effortMinutes: 30,
          notes: null,
          completedAt: null,
        },
      ],
      workItems: [
        { id: "w1", assignmentId: "a1", title: "Draft outline", effortMinutes: 30, completedAt: null, position: 0 },
      ],
      courseName: () => "Biology",
    });

    await screen.findByText("Draft outline");
    expect(screen.getByText("Essay · Biology")).toBeInTheDocument();
  });

  it("shows 'Preparation still needs a plan' only when something is due within two days and nothing is scheduled for it", async () => {
    renderWeekLookAhead({
      assignments: [
        {
          id: "a1",
          courseId: "course-1",
          title: "Essay",
          dueDate: TODAY_ISO,
          effortMinutes: 60,
          notes: null,
          completedAt: null,
        },
      ],
    });

    expect(await screen.findByText(/preparation still needs a plan/i)).toBeInTheDocument();
  });

  it("shows 'Nothing scheduled' for a day with nothing due, nothing planned, and no Activities", async () => {
    renderWeekLookAhead();

    expect((await screen.findAllByText(/nothing scheduled/i)).length).toBeGreaterThan(0);
  });

  it("never shows 'Preparation still needs a plan' for a day due more than two days out with nothing planned", async () => {
    renderWeekLookAhead({
      assignments: [
        {
          id: "a1",
          courseId: "course-1",
          // Today + 5 days.
          dueDate: "2026-03-21",
          title: "Essay",
          effortMinutes: 60,
          notes: null,
          completedAt: null,
        },
      ],
    });

    await screen.findByRole("button", { name: /due: essay/i });
    expect(screen.queryByText(/preparation still needs a plan/i)).not.toBeInTheDocument();
  });

  it("does not warn when the due assignment's work is already scheduled on a different (earlier) day", async () => {
    // Reproduces the reported bug: an assignment due tomorrow whose two
    // steps are both already planned for today was still flagged as
    // "Preparation still needs a plan" on tomorrow's card, because the
    // check only looked at sessions scheduled on that exact date.
    mockedWorkSessionService.listWorkSessionsForStudent.mockResolvedValue([
      { id: "s1", workItemId: "w1", date: TODAY_ISO, plannedMinutes: 30, startTime: "16:00", status: "planned" },
      { id: "s2", workItemId: "w2", date: TODAY_ISO, plannedMinutes: 45, startTime: "16:30", status: "planned" },
    ]);

    renderWeekLookAhead({
      assignments: [
        {
          id: "a1",
          courseId: "course-1",
          title: "Chapter 1 problems",
          // Tomorrow — still within the two-day due-soon window.
          dueDate: "2026-03-17",
          effortMinutes: 75,
          notes: null,
          completedAt: null,
        },
      ],
      workItems: [
        { id: "w1", assignmentId: "a1", title: "Q 1-10", effortMinutes: 30, completedAt: null, position: 0 },
        { id: "w2", assignmentId: "a1", title: "Q 11-20", effortMinutes: 45, completedAt: null, position: 1 },
      ],
    });

    await screen.findByRole("button", { name: /due: chapter 1 problems/i });
    expect(screen.queryByText(/preparation still needs a plan/i)).not.toBeInTheDocument();
  });
});
