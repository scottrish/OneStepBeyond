import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "@supabase/supabase-js";

vi.mock("../services/assignmentService", () => ({
  listAssignments: vi.fn(),
}));
vi.mock("../services/workItemService", () => ({
  listWorkItemsForStudent: vi.fn(),
}));
vi.mock("../services/courseService", () => ({
  listCourses: vi.fn(),
}));
vi.mock("../services/workSessionService", () => ({
  listWorkSessionsForDate: vi.fn(),
  updateWorkSessionStatus: vi.fn(),
  updateWorkSessionPlannedMinutes: vi.fn(),
  deleteWorkSession: vi.fn(),
}));
vi.mock("../services/reflectionService", () => ({
  recordReflection: vi.fn(),
}));

import * as assignmentService from "../services/assignmentService";
import * as workItemService from "../services/workItemService";
import * as courseService from "../services/courseService";
import * as workSessionService from "../services/workSessionService";
import * as reflectionService from "../services/reflectionService";
import TodayExecutionPage from "./TodayExecutionPage";

const mockedAssignmentService = assignmentService as unknown as {
  listAssignments: ReturnType<typeof vi.fn>;
};
const mockedWorkItemService = workItemService as unknown as {
  listWorkItemsForStudent: ReturnType<typeof vi.fn>;
};
const mockedCourseService = courseService as unknown as {
  listCourses: ReturnType<typeof vi.fn>;
};
const mockedWorkSessionService = workSessionService as unknown as {
  listWorkSessionsForDate: ReturnType<typeof vi.fn>;
  updateWorkSessionStatus: ReturnType<typeof vi.fn>;
  updateWorkSessionPlannedMinutes: ReturnType<typeof vi.fn>;
  deleteWorkSession: ReturnType<typeof vi.fn>;
};
const mockedReflectionService = reflectionService as unknown as {
  recordReflection: ReturnType<typeof vi.fn>;
};

const user = { id: "student-1", email: "person@example.com" } as User;
const course = { id: "course-1", name: "Biology", colorIndex: 0 };
const assignment = {
  id: "a1",
  courseId: "course-1",
  title: "Cell structure project",
  dueDate: "2026-03-20",
  effortMinutes: 60,
  notes: null,
  completedAt: null,
};

function workItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "w1",
    assignmentId: "a1",
    title: "Draft outline",
    effortMinutes: 30,
    completedAt: null,
    position: 0,
    ...overrides,
  };
}

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: "s1",
    workItemId: "w1",
    date: "2026-03-16",
    plannedMinutes: 30,
    startTime: "16:00",
    status: "planned" as const,
    ...overrides,
  };
}

// 2026-03-16 is fixed as "today" so current-task/ordering logic is
// deterministic regardless of the real current date.
const TODAY = new Date(2026, 2, 16, 9, 0, 0);

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(TODAY);
  mockedAssignmentService.listAssignments.mockResolvedValue([assignment]);
  mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([workItem()]);
  mockedCourseService.listCourses.mockResolvedValue([course]);
  mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("TodayExecutionPage", () => {
  it("shows an empty state with a link back to Plan when nothing is planned today", async () => {
    const onBack = vi.fn();
    render(<TodayExecutionPage user={user} onBack={onBack} />);

    expect(await screen.findByText(/nothing planned for today yet/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /plan today/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows the current task with its assignment/course context and a Start button while planned", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([session()]);

    render(<TodayExecutionPage user={user} onBack={vi.fn()} />);

    expect(await screen.findByText("Draft outline")).toBeInTheDocument();
    expect(screen.getByText(/cell structure project · biology/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^start$/i })).toBeInTheDocument();
    // Not yet started — Done/Need more time/stuck aren't shown until Start.
    expect(screen.queryByRole("button", { name: /^done$/i })).not.toBeInTheDocument();
  });

  it("Start marks the session in progress and reveals Done/Need more time/stuck", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([session()]);
    mockedWorkSessionService.updateWorkSessionStatus.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<TodayExecutionPage user={user} onBack={vi.fn()} />);
    await screen.findByText("Draft outline");

    await userEventInstance.click(screen.getByRole("button", { name: /^start$/i }));

    expect(mockedWorkSessionService.updateWorkSessionStatus).toHaveBeenCalledWith(
      "s1",
      "in_progress",
    );
    expect(await screen.findByRole("button", { name: /^done$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /need more time/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /i.m stuck/i })).toBeInTheDocument();
  });

  it("Done marks the session complete and immediately asks the one reflection question", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
      session({ status: "in_progress" }),
    ]);
    mockedWorkSessionService.updateWorkSessionStatus.mockResolvedValue(undefined);
    mockedReflectionService.recordReflection.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<TodayExecutionPage user={user} onBack={vi.fn()} />);
    await screen.findByText("Draft outline");

    await userEventInstance.click(screen.getByRole("button", { name: /^done$/i }));

    expect(mockedWorkSessionService.updateWorkSessionStatus).toHaveBeenCalledWith("s1", "done");
    expect(
      await screen.findByText(/did this take longer than you expected/i),
    ).toBeInTheDocument();

    await userEventInstance.click(screen.getByRole("radio", { name: /about right/i }));

    await waitFor(() =>
      expect(mockedReflectionService.recordReflection).toHaveBeenCalledWith("student-1", {
        assignmentId: "a1",
        trigger: "work_session_reflection",
        structuredResponse: "About right",
        freeText: null,
        proposedAdjustment: null,
      }),
    );
  });

  it("skipping the reflection question does not record anything and does not block", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
      session({ status: "in_progress" }),
    ]);
    mockedWorkSessionService.updateWorkSessionStatus.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<TodayExecutionPage user={user} onBack={vi.fn()} />);
    await screen.findByText("Draft outline");
    await userEventInstance.click(screen.getByRole("button", { name: /^done$/i }));
    await screen.findByText(/did this take longer than you expected/i);

    await userEventInstance.click(screen.getByRole("button", { name: /skip this question/i }));

    expect(mockedReflectionService.recordReflection).not.toHaveBeenCalled();
    // Only one session existed and it's now done — the all-done screen.
    expect(await screen.findByText(/that.s everything for today/i)).toBeInTheDocument();
  });

  it("Need more time adds 10 minutes without changing anything else", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
      session({ status: "in_progress", plannedMinutes: 30 }),
    ]);
    mockedWorkSessionService.updateWorkSessionPlannedMinutes.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<TodayExecutionPage user={user} onBack={vi.fn()} />);
    await screen.findByText("Draft outline");

    await userEventInstance.click(screen.getByRole("button", { name: /need more time/i }));

    expect(mockedWorkSessionService.updateWorkSessionPlannedMinutes).toHaveBeenCalledWith(
      "s1",
      40,
    );
  });

  it("I'm stuck shows non-judgmental coaching copy with keep-going and move-to-tomorrow choices", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
      session({ status: "in_progress" }),
    ]);
    const userEventInstance = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<TodayExecutionPage user={user} onBack={vi.fn()} />);
    await screen.findByText("Draft outline");

    await userEventInstance.click(screen.getByRole("button", { name: /i.m stuck/i }));

    expect(
      screen.getByText(/being stuck is information, not failure/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /keep going/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /move to tomorrow/i })).toBeInTheDocument();
  });

  it("Keep going returns to the normal task view without changing the session", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
      session({ status: "in_progress" }),
    ]);
    const userEventInstance = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<TodayExecutionPage user={user} onBack={vi.fn()} />);
    await screen.findByText("Draft outline");
    await userEventInstance.click(screen.getByRole("button", { name: /i.m stuck/i }));

    await userEventInstance.click(screen.getByRole("button", { name: /keep going/i }));

    expect(screen.getByRole("button", { name: /^done$/i })).toBeInTheDocument();
    expect(mockedWorkSessionService.deleteWorkSession).not.toHaveBeenCalled();
  });

  it("Move to tomorrow defers the session, dropping it out of today's list entirely", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
      session({ status: "in_progress" }),
    ]);
    mockedWorkSessionService.deleteWorkSession.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<TodayExecutionPage user={user} onBack={vi.fn()} />);
    await screen.findByText("Draft outline");
    await userEventInstance.click(screen.getByRole("button", { name: /i.m stuck/i }));

    await userEventInstance.click(screen.getByRole("button", { name: /move to tomorrow/i }));

    await waitFor(() =>
      expect(mockedWorkSessionService.deleteWorkSession).toHaveBeenCalledWith("s1"),
    );
    // No other session was planned today — dropping this one leaves none.
    expect(await screen.findByText(/nothing planned for today yet/i)).toBeInTheDocument();
  });

  it("shows a lightweight 'After that' list without expanding later items", async () => {
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([
      workItem({ id: "w1", title: "Draft outline" }),
      workItem({ id: "w2", title: "Write conclusion" }),
    ]);
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
      session({ id: "s1", workItemId: "w1", startTime: "16:00" }),
      session({ id: "s2", workItemId: "w2", startTime: "17:00", plannedMinutes: 20 }),
    ]);

    render(<TodayExecutionPage user={user} onBack={vi.fn()} />);

    expect(await screen.findByText("Draft outline")).toBeInTheDocument();
    expect(screen.getByText(/after that/i)).toBeInTheDocument();
    const upNextItem = screen.getByText("Write conclusion").closest("li");
    expect(upNextItem).not.toBeNull();
    // Title + duration only — no expanded assignment/course context, per
    // "visible only as a lightweight 'After that' list... not expanded."
    expect(within(upNextItem as HTMLElement).getByText(/20m/)).toBeInTheDocument();
    expect(
      within(upNextItem as HTMLElement).queryByText(/cell structure project/i),
    ).not.toBeInTheDocument();
  });

  it("shows the calm all-done screen, not a stats summary, once every session is done", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
      session({ status: "done" }),
    ]);

    render(<TodayExecutionPage user={user} onBack={vi.fn()} />);

    expect(
      await screen.findByText(/that.s everything for today/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/you did what you said you would\. the evening is yours\./i),
    ).toBeInTheDocument();
    // No timer, clock, or elapsed-time UI anywhere on this screen.
    expect(screen.queryByText(/\d+:\d+:\d+/)).not.toBeInTheDocument();
  });

  it("never renders a timer or running clock on the active task screen", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
      session({ status: "in_progress" }),
    ]);

    render(<TodayExecutionPage user={user} onBack={vi.fn()} />);
    await screen.findByText("Draft outline");

    expect(document.querySelector('[role="timer"]')).not.toBeInTheDocument();
  });

  it("Change today's plan is always available as an escape hatch", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([session()]);
    const onBack = vi.fn();
    render(<TodayExecutionPage user={user} onBack={onBack} />);
    await screen.findByText("Draft outline");

    await userEvent.click(screen.getByRole("button", { name: /change today.s plan/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
