import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "@supabase/supabase-js";

vi.mock("../services/activityService", () => ({
  listActivities: vi.fn(),
  createActivity: vi.fn(),
  updateActivityDays: vi.fn(),
  deleteActivity: vi.fn(),
}));
vi.mock("../services/assignmentService", () => ({
  listAssignments: vi.fn(),
  createAssignment: vi.fn(),
  getAssignment: vi.fn(),
  updateAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
  completeAssignment: vi.fn(),
}));
vi.mock("../services/workItemService", () => ({
  listWorkItemsForStudent: vi.fn(),
  listWorkItems: vi.fn(),
  createWorkItems: vi.fn(),
  deleteWorkItems: vi.fn(),
  completeAllForAssignment: vi.fn(),
}));
vi.mock("../services/courseService", () => ({
  listCourses: vi.fn(),
  createCourse: vi.fn(),
  renameCourse: vi.fn(),
}));
vi.mock("../services/workSessionService", () => ({
  listWorkSessionsForDate: vi.fn(),
  listWorkSessionsForStudent: vi.fn(),
  createWorkSessions: vi.fn(),
  deletePlannedSessionsForDate: vi.fn(),
  deleteWorkSession: vi.fn(),
}));
vi.mock("../services/planningSessionService", () => ({
  recordPlanningSession: vi.fn(),
}));

import * as activityService from "../services/activityService";
import * as assignmentService from "../services/assignmentService";
import * as workItemService from "../services/workItemService";
import * as courseService from "../services/courseService";
import * as workSessionService from "../services/workSessionService";
import * as planningSessionService from "../services/planningSessionService";
import PlanPage from "./PlanPage";

const mockedActivityService = activityService as unknown as {
  listActivities: ReturnType<typeof vi.fn>;
};
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
  listWorkSessionsForStudent: ReturnType<typeof vi.fn>;
  createWorkSessions: ReturnType<typeof vi.fn>;
  deletePlannedSessionsForDate: ReturnType<typeof vi.fn>;
  deleteWorkSession: ReturnType<typeof vi.fn>;
};
const mockedPlanningSessionService = planningSessionService as unknown as {
  recordPlanningSession: ReturnType<typeof vi.fn>;
};

const user = { id: "student-1", email: "person@example.com" } as User;
const course = { id: "course-1", name: "Biology", colorIndex: 0 };

// 2026-03-16 is a Monday — fixed so capacity/weekday-window math and the
// day-picker strip are deterministic regardless of the real current date.
const TODAY = new Date(2026, 2, 16, 9, 0, 0);

function assignment(overrides: Record<string, unknown> = {}) {
  return {
    id: "a1",
    courseId: "course-1",
    title: "Essay",
    dueDate: "2026-03-20",
    effortMinutes: 60,
    notes: null,
    completedAt: null,
    ...overrides,
  };
}

function workItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "w1",
    assignmentId: "a1",
    title: "Draft outline",
    effortMinutes: 20,
    completedAt: null,
    position: 0,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // shouldAdvanceTime lets real wall-clock time keep flowing (so
  // testing-library's setTimeout-based waitFor/findBy* polling still
  // resolves) while Date/`new Date()` stay pinned to TODAY.
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(TODAY);
  mockedActivityService.listActivities.mockResolvedValue([]);
  mockedAssignmentService.listAssignments.mockResolvedValue([]);
  mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([]);
  mockedCourseService.listCourses.mockResolvedValue([course]);
  mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([]);
  mockedWorkSessionService.listWorkSessionsForStudent.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("PlanPage", () => {
  it("shows the Day step first, with the explicit Step 1 of 5 label and no other progress indicator", async () => {
    render(<PlanPage user={user} />);

    expect(await screen.findByText(/step 1 of 5/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /let.s plan today/i })).toBeInTheDocument();
    // Only the explicit step label — no progress bar/dots.
    expect(document.querySelectorAll("[role='progressbar']").length).toBe(0);
  });

  it("states remaining capacity in plain language on the Day step", async () => {
    render(<PlanPage user={user} />);

    // Monday window 15:15-21:00 (345 min) minus 90 protected = 4h 15m.
    expect(await screen.findByText(/that leaves about/i)).toBeInTheDocument();
    expect(screen.getByText(/4h 15m/)).toBeInTheDocument();
  });

  it("shows what's due that day and existing Activities on the Day step", async () => {
    mockedAssignmentService.listAssignments.mockResolvedValue([
      assignment({ id: "a1", dueDate: "2026-03-16" }),
    ]);
    mockedActivityService.listActivities.mockResolvedValue([
      {
        id: "act-1",
        name: "Football practice",
        days: [1],
        startTime: "17:00",
        finishTime: "18:00",
        travelMinutes: 0,
      },
    ]);

    render(<PlanPage user={user} />);

    expect(await screen.findByText(/due: essay/i)).toBeInTheDocument();
    expect(screen.getByText("Football practice")).toBeInTheDocument();
  });

  it("shows an already-planned session with its parent assignment and course, and can remove it", async () => {
    mockedAssignmentService.listAssignments.mockResolvedValue([assignment()]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([workItem()]);
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
      {
        id: "session-1",
        workItemId: "w1",
        date: "2026-03-16",
        plannedMinutes: 30,
        startTime: "16:00",
        status: "planned",
      },
    ]);
    mockedWorkSessionService.deleteWorkSession.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });

    render(<PlanPage user={user} />);

    expect(await screen.findByText(/already planned/i)).toBeInTheDocument();
    expect(screen.getByText("Draft outline")).toBeInTheDocument();
    expect(screen.getByText(/essay · biology/i)).toBeInTheDocument();

    await userEventInstance.click(
      screen.getByRole("button", { name: /remove draft outline/i }),
    );

    await waitFor(() =>
      expect(mockedWorkSessionService.deleteWorkSession).toHaveBeenCalledWith("session-1"),
    );
  });

  it("Select step shows only three candidates with a 'show more' action to reveal the rest, each with its assignment and course", async () => {
    mockedAssignmentService.listAssignments.mockResolvedValue([
      assignment({ id: "a1", title: "Essay 1", dueDate: "2026-03-17" }),
      assignment({ id: "a2", title: "Essay 2", dueDate: "2026-03-18" }),
      assignment({ id: "a3", title: "Essay 3", dueDate: "2026-03-19" }),
      assignment({ id: "a4", title: "Essay 4", dueDate: "2026-03-20" }),
    ]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([
      workItem({ id: "w1", assignmentId: "a1", title: "Step 1" }),
      workItem({ id: "w2", assignmentId: "a2", title: "Step 2" }),
      workItem({ id: "w3", assignmentId: "a3", title: "Step 3" }),
      workItem({ id: "w4", assignmentId: "a4", title: "Step 4" }),
    ]);
    const userEventInstance = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });

    render(<PlanPage user={user} />);
    await screen.findByText(/step 1 of 5/i);
    await userEventInstance.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByText(/step 2 of 5/i)).toBeInTheDocument();
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Step 2")).toBeInTheDocument();
    expect(screen.getByText("Step 3")).toBeInTheDocument();
    expect(screen.queryByText("Step 4")).not.toBeInTheDocument();
    expect(screen.getByText(/essay 1 · biology/i)).toBeInTheDocument();

    await userEventInstance.click(screen.getByRole("button", { name: /show more assignments/i }));
    expect(screen.getByText("Step 4")).toBeInTheDocument();
  });

  it("completes the full flow: select, estimate with a coaching-free running total, schedule, and confirm", async () => {
    mockedAssignmentService.listAssignments.mockResolvedValue([
      assignment({ id: "a1", title: "Essay", dueDate: "2026-03-17" }),
    ]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([
      workItem({ id: "w1", assignmentId: "a1", title: "Draft outline", effortMinutes: 20 }),
    ]);
    mockedWorkSessionService.deletePlannedSessionsForDate.mockResolvedValue(undefined);
    mockedWorkSessionService.createWorkSessions.mockResolvedValue([
      {
        id: "session-1",
        workItemId: "w1",
        date: "2026-03-16",
        plannedMinutes: 25,
        startTime: "15:15",
        status: "planned",
      },
    ]);
    mockedPlanningSessionService.recordPlanningSession.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });

    render(<PlanPage user={user} />);
    await screen.findByText(/step 1 of 5/i);
    await userEventInstance.click(screen.getByRole("button", { name: /continue/i }));

    await screen.findByText(/step 2 of 5/i);
    await userEventInstance.click(screen.getByRole("button", { name: /draft outline/i }));
    await userEventInstance.click(screen.getByRole("button", { name: /next: estimate time/i }));

    await screen.findByText(/step 3 of 5/i);
    expect(screen.getByText(/selected:/i).closest("p")).toHaveTextContent("Selected: 20m");
    await userEventInstance.click(
      screen.getByRole("button", { name: /increase planned time for draft outline/i }),
    );
    expect(screen.getByText(/selected:/i).closest("p")).toHaveTextContent("Selected: 25m");
    await userEventInstance.click(screen.getByRole("button", { name: /next: when/i }));

    await screen.findByText(/step 4 of 5/i);
    expect(screen.getByText(/these are suggestions/i)).toBeInTheDocument();
    await userEventInstance.click(screen.getByRole("button", { name: /next: review/i }));

    await screen.findByText(/step 5 of 5/i);
    expect(screen.getByText("Draft outline")).toBeInTheDocument();
    expect(screen.getByText(/essay · biology/i)).toBeInTheDocument();

    await userEventInstance.click(screen.getByRole("button", { name: /looks good/i }));

    await waitFor(() =>
      expect(mockedWorkSessionService.deletePlannedSessionsForDate).toHaveBeenCalledWith(
        "student-1",
        "2026-03-16",
      ),
    );
    expect(mockedWorkSessionService.createWorkSessions).toHaveBeenCalledWith("student-1", [
      { workItemId: "w1", date: "2026-03-16", plannedMinutes: 25, startTime: "15:15" },
    ]);
    expect(mockedPlanningSessionService.recordPlanningSession).toHaveBeenCalledWith(
      "student-1",
      { date: "2026-03-16", itemsPlanned: 1, minutesPlanned: 25 },
    );

    // Neither Today Execution nor Week Look-ahead exists yet — confirms
    // in place with a success acknowledgment instead of navigating.
    expect(await screen.findByText(/plan confirmed/i)).toBeInTheDocument();
  });

  it("shows a calm over-capacity notice without blocking progress when selected time exceeds capacity", async () => {
    mockedAssignmentService.listAssignments.mockResolvedValue([assignment()]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([
      workItem({ id: "w1", title: "Huge task", effortMinutes: 500 }),
    ]);
    const userEventInstance = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });

    render(<PlanPage user={user} />);
    await screen.findByText(/step 1 of 5/i);
    await userEventInstance.click(screen.getByRole("button", { name: /continue/i }));
    await screen.findByText(/step 2 of 5/i);
    await userEventInstance.click(screen.getByRole("button", { name: /huge task/i }));
    await userEventInstance.click(screen.getByRole("button", { name: /next: estimate time/i }));

    expect(
      await screen.findByText(/more than you have that day/i),
    ).toBeInTheDocument();
    // The student can still proceed — the app states reality, it does not block.
    expect(screen.getByRole("button", { name: /next: when/i })).toBeEnabled();
  });

  it("shows a course-context empty state on Select when there are no open work items", async () => {
    render(<PlanPage user={user} />);
    await screen.findByText(/step 1 of 5/i);

    await userEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByText(/nothing to plan yet/i)).toBeInTheDocument();
  });

  it("switching to a different day in the picker resets the flow to the Day step", async () => {
    const userEventInstance = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    render(<PlanPage user={user} />);
    await screen.findByText(/step 1 of 5/i);

    await userEventInstance.click(screen.getByRole("button", { name: /continue/i }));
    await screen.findByText(/step 2 of 5/i);

    const dayPicker = screen.getByRole("radiogroup", { name: /choose a day to plan/i });
    const tuesday = within(dayPicker).getAllByRole("radio")[1];
    await userEventInstance.click(tuesday);

    expect(await screen.findByText(/step 1 of 5/i)).toBeInTheDocument();
  });
});
