import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
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
vi.mock("../services/decompositionAttemptService", () => ({
  recordDecompositionAttempt: vi.fn(),
}));

import * as activityService from "../services/activityService";
import * as assignmentService from "../services/assignmentService";
import * as workItemService from "../services/workItemService";
import * as courseService from "../services/courseService";
import * as workSessionService from "../services/workSessionService";
import * as planningSessionService from "../services/planningSessionService";
import * as decompositionAttemptService from "../services/decompositionAttemptService";
import PlanPage from "./PlanPage";
import type { Step } from "./PlanPage";

const mockedActivityService = activityService as unknown as {
  listActivities: ReturnType<typeof vi.fn>;
};
const mockedAssignmentService = assignmentService as unknown as {
  listAssignments: ReturnType<typeof vi.fn>;
  updateAssignment: ReturnType<typeof vi.fn>;
};
const mockedWorkItemService = workItemService as unknown as {
  listWorkItemsForStudent: ReturnType<typeof vi.fn>;
  createWorkItems: ReturnType<typeof vi.fn>;
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
const mockedDecompositionAttemptService = decompositionAttemptService as unknown as {
  recordDecompositionAttempt: ReturnType<typeof vi.fn>;
};

const user = { id: "student-1", email: "person@example.com" } as User;
const course = { id: "course-1", name: "Biology", colorIndex: 0 };

// 2026-03-16 is a Monday — fixed so capacity/weekday-window math and the
// day-picker strip are deterministic regardless of the real current date.
const TODAY = new Date(2026, 2, 16, 9, 0, 0);
const TODAY_ISO = "2026-03-16";

// date/step now live in App.tsx (docs/features/iterations/
// daily-planning/daily-planning.i02.md FR-2) and are passed to PlanPage
// as controlled props. This wrapper mimics App.tsx's own state so every
// existing test keeps exercising PlanPage exactly as before.
function ControlledPlanPage({ user }: { user: User }) {
  const [date, setDate] = useState(TODAY_ISO);
  const [step, setStep] = useState<Step>("day");
  return (
    <PlanPage user={user} date={date} step={step} onDateChange={setDate} onStepChange={setStep} />
  );
}

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
  mockedDecompositionAttemptService.recordDecompositionAttempt.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("PlanPage", () => {
  it("shows the Day step first, with the explicit Step 1 of 5 label and no other progress indicator", async () => {
    render(<ControlledPlanPage user={user} />);

    expect(await screen.findByText(/step 1 of 5/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /let.s plan today/i })).toBeInTheDocument();
    // Only the explicit step label — no progress bar/dots.
    expect(document.querySelectorAll("[role='progressbar']").length).toBe(0);
  });

  it("states remaining capacity in plain language on the Day step", async () => {
    render(<ControlledPlanPage user={user} />);

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

    render(<ControlledPlanPage user={user} />);

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

    render(<ControlledPlanPage user={user} />);

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

    render(<ControlledPlanPage user={user} />);
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

    render(<ControlledPlanPage user={user} />);
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

    render(<ControlledPlanPage user={user} />);
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
    render(<ControlledPlanPage user={user} />);
    await screen.findByText(/step 1 of 5/i);

    await userEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByText(/nothing to plan yet/i)).toBeInTheDocument();
  });

  it("switching to a different day in the picker resets the flow to the Day step", async () => {
    const userEventInstance = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    render(<ControlledPlanPage user={user} />);
    await screen.findByText(/step 1 of 5/i);

    await userEventInstance.click(screen.getByRole("button", { name: /continue/i }));
    await screen.findByText(/step 2 of 5/i);

    const dayPicker = screen.getByRole("radiogroup", { name: /choose a day to plan/i });
    const tuesday = within(dayPicker).getAllByRole("radio")[1];
    await userEventInstance.click(tuesday);

    expect(await screen.findByText(/step 1 of 5/i)).toBeInTheDocument();
  });

  // docs/features/iterations/daily-planning/daily-planning.i02.md FR-1
  describe("breakdown prerequisite signal and routing", () => {
    it("names the assignment needing breakdown on the Day step, before Select would otherwise dead-end", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        assignment({ id: "a1", title: "Essay" }),
      ]);

      render(<ControlledPlanPage user={user} />);

      expect(await screen.findByText(/step 1 of 5/i)).toBeInTheDocument();
      expect(
        screen.getByText(/essay.*needs to be broken into steps before it can be scheduled/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /break down .essay./i }),
      ).toBeInTheDocument();
    });

    it("replaces Select's dead end with the named assignment and a direct breakdown link", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        assignment({ id: "a1", title: "Essay" }),
      ]);
      const userEventInstance = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(<ControlledPlanPage user={user} />);
      await screen.findByText(/step 1 of 5/i);
      await userEventInstance.click(screen.getByRole("button", { name: /continue/i }));

      expect(await screen.findByText(/step 2 of 5/i)).toBeInTheDocument();
      expect(screen.getByText(/nothing to plan yet/i)).toBeInTheDocument();
      expect(
        screen.getByText(/break .essay. into steps first, then come back/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /break down .essay./i }),
      ).toBeInTheDocument();
    });

    it("lets the student complete a breakdown started from the signal and returns to Plan on the same step with the item now selectable", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        assignment({ id: "a1", title: "Essay" }),
      ]);
      mockedWorkItemService.listWorkItemsForStudent
        .mockResolvedValueOnce([])
        .mockResolvedValue([
          workItem({ id: "w1", assignmentId: "a1", title: "Draft outline", effortMinutes: 30 }),
        ]);
      mockedWorkItemService.createWorkItems.mockResolvedValue([
        {
          id: "w1",
          assignmentId: "a1",
          title: "Draft outline",
          effortMinutes: 30,
          completedAt: null,
          position: 0,
        },
      ]);
      mockedAssignmentService.updateAssignment.mockResolvedValue(undefined);
      const userEventInstance = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(<ControlledPlanPage user={user} />);
      await screen.findByText(/step 1 of 5/i);
      await userEventInstance.click(screen.getByRole("button", { name: /continue/i }));
      await screen.findByText(/step 2 of 5/i);

      await userEventInstance.click(
        screen.getByRole("button", { name: /break down .essay./i }),
      );

      expect(await screen.findByText(/what are the main pieces/i)).toBeInTheDocument();

      const addInput = screen.getByPlaceholderText(/questions 1–10/i);
      await userEventInstance.type(addInput, "Draft outline");
      await userEventInstance.click(screen.getByRole("button", { name: /^add$/i }));
      await userEventInstance.click(screen.getByRole("button", { name: /^next$/i }));

      await userEventInstance.click(
        within(
          screen.getByRole("radiogroup", { name: /estimated time for draft outline/i }),
        ).getByRole("radio", { name: "30m" }),
      );
      await userEventInstance.click(screen.getByRole("button", { name: /^next$/i }));
      await userEventInstance.click(screen.getByRole("button", { name: /looks good/i }));

      // Back on Plan, at the same step it left off at (Select), the
      // dead end is gone and the newly-broken-down item is available.
      expect(await screen.findByText(/step 2 of 5/i)).toBeInTheDocument();
      expect(await screen.findByText("Draft outline")).toBeInTheDocument();
      expect(screen.queryByText(/nothing to plan yet/i)).not.toBeInTheDocument();
    });

    it("cancelling a breakdown started from the signal returns to Plan unchanged", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        assignment({ id: "a1", title: "Essay" }),
      ]);
      const userEventInstance = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(<ControlledPlanPage user={user} />);
      await screen.findByText(/step 1 of 5/i);

      await userEventInstance.click(
        screen.getByRole("button", { name: /break down .essay./i }),
      );
      expect(await screen.findByText(/what are the main pieces/i)).toBeInTheDocument();

      await userEventInstance.click(screen.getByRole("button", { name: /cancel/i }));

      expect(await screen.findByText(/step 1 of 5/i)).toBeInTheDocument();
      expect(
        screen.getByText(/essay.*needs to be broken into steps/i),
      ).toBeInTheDocument();
    });
  });

  // docs/decisions/20260816-plan-directly-without-breakdown.md — not every
  // assignment is meaningfully decomposable, so the breakdown signal also
  // offers a one-click alternative that skips the multi-step wizard.
  describe("planning an assignment directly without a breakdown", () => {
    it("creates a single Work Item matching the assignment and makes it selectable, without entering the breakdown wizard", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        assignment({ id: "a1", title: "Read chapter 1", effortMinutes: 60 }),
      ]);
      mockedWorkItemService.listWorkItemsForStudent
        .mockResolvedValueOnce([])
        .mockResolvedValue([
          workItem({ id: "w1", assignmentId: "a1", title: "Read chapter 1", effortMinutes: 60 }),
        ]);
      mockedWorkItemService.createWorkItems.mockResolvedValue([
        {
          id: "w1",
          assignmentId: "a1",
          title: "Read chapter 1",
          effortMinutes: 60,
          completedAt: null,
          position: 0,
        },
      ]);
      mockedAssignmentService.updateAssignment.mockResolvedValue(undefined);
      mockedDecompositionAttemptService.recordDecompositionAttempt.mockResolvedValue(undefined);
      const userEventInstance = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(<ControlledPlanPage user={user} />);
      await screen.findByText(/step 1 of 5/i);
      expect(
        screen.getByText(/read chapter 1.*needs to be broken into steps/i),
      ).toBeInTheDocument();

      await userEventInstance.click(
        screen.getByRole("button", { name: /plan .read chapter 1. as one task instead/i }),
      );

      expect(mockedWorkItemService.createWorkItems).toHaveBeenCalledWith("student-1", [
        { assignmentId: "a1", title: "Read chapter 1", effortMinutes: 60, position: 0 },
      ]);
      expect(mockedAssignmentService.updateAssignment).toHaveBeenCalledWith("a1", {
        title: "Read chapter 1",
        dueDate: "2026-03-20",
        notes: "",
        effortMinutes: 60,
      });
      expect(mockedDecompositionAttemptService.recordDecompositionAttempt).toHaveBeenCalledWith(
        "student-1",
        {
          assignmentId: "a1",
          initialWorkItems: [],
          resultingWorkItems: ["Read chapter 1"],
          revisionCount: 0,
          outcome: "confirmed",
        },
      );

      // The signal clears once the assignment has a Work Item, and the
      // wizard never left the Day step's own screen (no breakdown wizard
      // was ever rendered).
      await waitFor(() =>
        expect(
          screen.queryByText(/read chapter 1.*needs to be broken into steps/i),
        ).not.toBeInTheDocument(),
      );
      expect(screen.queryByText(/what are the main pieces/i)).not.toBeInTheDocument();

      await userEventInstance.click(screen.getByRole("button", { name: /continue/i }));
      expect(await screen.findByText(/step 2 of 5/i)).toBeInTheDocument();
      expect(screen.getByText("Read chapter 1")).toBeInTheDocument();
      expect(screen.queryByText(/nothing to plan yet/i)).not.toBeInTheDocument();
    });

    it("shows an error and re-enables the action if planning directly fails", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        assignment({ id: "a1", title: "Essay" }),
      ]);
      mockedWorkItemService.createWorkItems.mockRejectedValue(new Error("network down"));
      const userEventInstance = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(<ControlledPlanPage user={user} />);
      await screen.findByText(/step 1 of 5/i);

      const planButton = screen.getByRole("button", {
        name: /plan .essay. as one task instead/i,
      });
      await userEventInstance.click(planButton);

      expect(await screen.findByRole("alert")).toHaveTextContent(/network down/i);
      expect(
        screen.getByRole("button", { name: /plan .essay. as one task instead/i }),
      ).not.toBeDisabled();
    });
  });

  // docs/features/iterations/daily-planning/daily-planning.i03.md —
  // Problem A: the breakdown signal must not be silently omitted when
  // some (not all) of the day's assignments already have Work Items.
  describe("breakdown notice covers the mixed-candidates case (iteration 3)", () => {
    it("still names an assignment needing breakdown on Select, even when other candidates already exist", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        assignment({ id: "a1", title: "Essay", dueDate: "2026-03-17" }),
        assignment({ id: "a2", title: "Worksheet", dueDate: "2026-03-16" }),
      ]);
      // Only "Essay" has a Work Item — "Worksheet" (due today) does not.
      mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([
        workItem({ id: "w1", assignmentId: "a1", title: "Draft outline" }),
      ]);
      const userEventInstance = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(<ControlledPlanPage user={user} />);
      await screen.findByText(/step 1 of 5/i);
      await userEventInstance.click(screen.getByRole("button", { name: /continue/i }));

      // Select shows the real candidate (Draft outline) AND still names
      // the assignment that's missing — not silently omitted.
      expect(await screen.findByText(/step 2 of 5/i)).toBeInTheDocument();
      expect(screen.getByText("Draft outline")).toBeInTheDocument();
      expect(
        screen.getByText(/worksheet.*needs to be broken into steps before it can be scheduled/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /break down .worksheet./i }),
      ).toBeInTheDocument();
    });
  });

  // docs/features/iterations/daily-planning/daily-planning.i03.md FR-1
  describe("warns when a candidate is already scheduled for a different day", () => {
    it("shows an 'already planned for {day}' indicator instead of leaving the existing commitment invisible", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([assignment()]);
      mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([workItem()]);
      // The same work item already has a planned session on a different
      // date (2026-03-18) than the one being planned here (2026-03-16).
      mockedWorkSessionService.listWorkSessionsForStudent.mockResolvedValue([
        {
          id: "session-elsewhere",
          workItemId: "w1",
          date: "2026-03-18",
          plannedMinutes: 20,
          startTime: null,
          status: "planned",
        },
      ]);
      const userEventInstance = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(<ControlledPlanPage user={user} />);
      await screen.findByText(/step 1 of 5/i);
      await userEventInstance.click(screen.getByRole("button", { name: /continue/i }));

      expect(await screen.findByText(/step 2 of 5/i)).toBeInTheDocument();
      expect(await screen.findByText(/already planned for wednesday/i)).toBeInTheDocument();
    });

    it("does not warn about a session already planned for the day currently being planned", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([assignment()]);
      mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([workItem()]);
      mockedWorkSessionService.listWorkSessionsForStudent.mockResolvedValue([
        {
          id: "session-today",
          workItemId: "w1",
          date: "2026-03-16",
          plannedMinutes: 20,
          startTime: null,
          status: "planned",
        },
      ]);
      const userEventInstance = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(<ControlledPlanPage user={user} />);
      await screen.findByText(/step 1 of 5/i);
      await userEventInstance.click(screen.getByRole("button", { name: /continue/i }));

      expect(await screen.findByText(/step 2 of 5/i)).toBeInTheDocument();
      expect(screen.queryByText(/already planned for/i)).not.toBeInTheDocument();
    });

    // docs/playwright/daily-planning/iteration-03/findings.yaml FINDING-DP-003
    it("shows a session confirmed moments earlier in the same browsing session as already planned when checking another day", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        assignment({ id: "a1", title: "Essay", dueDate: "2026-03-20" }),
      ]);
      mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([
        workItem({ id: "w1", assignmentId: "a1", title: "Draft outline", effortMinutes: 20 }),
      ]);
      mockedWorkSessionService.deletePlannedSessionsForDate.mockResolvedValue(undefined);
      const createdSession = {
        id: "session-1",
        workItemId: "w1",
        date: "2026-03-16",
        plannedMinutes: 20,
        startTime: "15:15",
        status: "planned" as const,
      };
      mockedWorkSessionService.createWorkSessions.mockResolvedValue([createdSession]);
      // useEstimationDrift also calls listWorkSessionsForStudent on mount,
      // so the two hooks' calls can't be told apart by call order/count —
      // key the mock off whether the plan has actually been confirmed yet
      // instead. Flipped by recordPlanningSession, the last write inside
      // confirmPlan, right before PlanPage's refetch runs.
      let sessionConfirmed = false;
      mockedPlanningSessionService.recordPlanningSession.mockImplementation(async () => {
        sessionConfirmed = true;
      });
      mockedWorkSessionService.listWorkSessionsForStudent.mockImplementation(() =>
        Promise.resolve(sessionConfirmed ? [createdSession] : []),
      );
      const userEventInstance = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      render(<ControlledPlanPage user={user} />);
      await screen.findByText(/step 1 of 5/i);
      await userEventInstance.click(screen.getByRole("button", { name: /continue/i }));

      await screen.findByText(/step 2 of 5/i);
      await userEventInstance.click(screen.getByRole("button", { name: /draft outline/i }));
      await userEventInstance.click(screen.getByRole("button", { name: /next: estimate time/i }));

      await screen.findByText(/step 3 of 5/i);
      await userEventInstance.click(screen.getByRole("button", { name: /next: when/i }));

      await screen.findByText(/step 4 of 5/i);
      await userEventInstance.click(screen.getByRole("button", { name: /next: review/i }));

      await screen.findByText(/step 5 of 5/i);
      await userEventInstance.click(screen.getByRole("button", { name: /looks good/i }));
      await screen.findByText(/plan confirmed/i);

      const dayPicker = screen.getByRole("radiogroup", { name: /choose a day to plan/i });
      const tuesday = within(dayPicker).getAllByRole("radio")[1];
      await userEventInstance.click(tuesday);

      await screen.findByText(/step 1 of 5/i);
      await userEventInstance.click(screen.getByRole("button", { name: /continue/i }));

      expect(await screen.findByText(/step 2 of 5/i)).toBeInTheDocument();
      // Confirmed for 2026-03-16, which is TODAY per this file's fixed
      // system time — dayLabel renders that as "today", not the weekday
      // name, regardless of which day is currently being planned.
      expect(await screen.findByText(/already planned for today/i)).toBeInTheDocument();
    });
  });

  // docs/features/iterations/daily-planning/daily-planning.i02.md FR-2
  describe("wizard state survives tab navigation", () => {
    it("resumes on the same day/step when remounted (simulating a switch away and back)", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        assignment({ id: "a1", title: "Essay 1", dueDate: "2026-03-17" }),
      ]);
      mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([
        workItem({ id: "w1", assignmentId: "a1", title: "Draft outline" }),
      ]);
      const userEventInstance = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime,
      });

      function Harness() {
        const [mounted, setMounted] = useState(true);
        const [date, setDate] = useState(TODAY_ISO);
        const [step, setStep] = useState<Step>("day");
        return (
          <>
            <button type="button" onClick={() => setMounted((m) => !m)}>
              Toggle tab
            </button>
            {mounted && (
              <PlanPage
                user={user}
                date={date}
                step={step}
                onDateChange={setDate}
                onStepChange={setStep}
              />
            )}
          </>
        );
      }

      render(<Harness />);
      await screen.findByText(/step 1 of 5/i);
      await userEventInstance.click(screen.getByRole("button", { name: /continue/i }));
      await screen.findByText(/step 2 of 5/i);

      // Simulate App.tsx's conditional render unmounting PlanPage when
      // another tab becomes active, then remounting it when Plan is
      // tapped again — date/step are owned by this harness (App.tsx's
      // stand-in), not PlanPage, so they must survive.
      await userEventInstance.click(screen.getByRole("button", { name: /toggle tab/i }));
      await userEventInstance.click(screen.getByRole("button", { name: /toggle tab/i }));

      expect(await screen.findByText(/step 2 of 5/i)).toBeInTheDocument();
      expect(screen.queryByText(/step 1 of 5/i)).not.toBeInTheDocument();
    });

    it("falls back to the Day step, instead of rendering a broken screen, when remounted mid-flow with no surviving selections", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        assignment({ id: "a1", title: "Essay 1", dueDate: "2026-03-17" }),
      ]);
      mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([
        workItem({ id: "w1", assignmentId: "a1", title: "Draft outline" }),
      ]);

      // Rendered directly at "estimate" with nothing chosen — the state
      // a remount would leave behind if the student had gotten past
      // Select before switching tabs away and back (chosen/times are
      // intentionally not lifted, per FR-2's scope — see safeStep in
      // PlanPage.tsx).
      render(
        <PlanPage
          user={user}
          date={TODAY_ISO}
          step="estimate"
          onDateChange={vi.fn()}
          onStepChange={vi.fn()}
        />,
      );

      expect(await screen.findByText(/step 1 of 5/i)).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /let.s plan today/i })).toBeInTheDocument();
    });
  });
});
