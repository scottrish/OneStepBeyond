import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    // Only the planned session gets a remove route — via its row menu
    // (docs/features/mobile-gestures-reorder-and-swipe-v0.1.md §2).
    expect(
      screen.getByRole("button", { name: "More actions for Draft outline" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /more actions for write conclusion/i }),
    ).not.toBeInTheDocument();

    await userEventInstance.click(screen.getByRole("button", { name: "More actions for Draft outline" }));
    await userEventInstance.click(await screen.findByRole("menuitem", { name: "Remove" }));
    expect(mockedWorkSessionService.deleteWorkSession).toHaveBeenCalledWith("s1");
  });

  it("offers no remove route for an in-progress session (it's ended from Today, not deleted here)", async () => {
    mockedWorkSessionService.listWorkSessionsForStudent.mockResolvedValue([
      { id: "s3", workItemId: "w3", date: TODAY_ISO, plannedMinutes: 30, startTime: "16:00", status: "in_progress" },
    ]);

    renderWeekLookAhead({
      workItems: [
        { id: "w3", assignmentId: "a1", title: "Revise intro", effortMinutes: 30, completedAt: null, position: 0 },
      ],
    });

    const title = await screen.findByText("Revise intro");
    expect(screen.queryByRole("button", { name: /more actions for revise intro/i })).not.toBeInTheDocument();
    expect(title.closest("[data-swipe-content]")).toBeNull();
  });

  it("swiping a planned session reveals Remove, which removes it", async () => {
    mockedWorkSessionService.listWorkSessionsForStudent.mockResolvedValue([
      { id: "s1", workItemId: "w1", date: TODAY_ISO, plannedMinutes: 30, startTime: "16:00", status: "planned" },
    ]);
    mockedWorkSessionService.deleteWorkSession.mockResolvedValue(undefined);

    renderWeekLookAhead({
      workItems: [
        { id: "w1", assignmentId: "a1", title: "Draft outline", effortMinutes: 30, completedAt: null, position: 0 },
      ],
    });
    const title = await screen.findByText("Draft outline");
    const surface = title.closest("[data-swipe-content]")!;
    const start = { clientX: 300, clientY: 100, pointerId: 1, pointerType: "touch" };
    fireEvent.pointerDown(title, start);
    for (const x of [290, 270, 250, 230, 210]) fireEvent.pointerMove(surface, { ...start, clientX: x });
    fireEvent.pointerUp(surface, { ...start, clientX: 210 });

    fireEvent.click(screen.getByRole("button", { name: "Remove Draft outline from today's plan" }));

    await waitFor(() => expect(mockedWorkSessionService.deleteWorkSession).toHaveBeenCalledWith("s1"));
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
