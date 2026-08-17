import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "./hooks/useAuth";
import App from "./App";

vi.mock("./hooks/useAuth");

// Needed only for the "Assignments tab reset" test below, which
// navigates into a nested Assignment Detail screen the same way
// FINDING-WB-001 was found — but every other test in this file renders
// fine without any assignment ever loading, so these all default to
// resolving empty/undefined.
vi.mock("./services/courseService", () => ({
  listCourses: vi.fn().mockResolvedValue([]),
  createCourse: vi.fn(),
  renameCourse: vi.fn(),
}));
vi.mock("./services/assignmentService", () => ({
  listAssignments: vi.fn().mockResolvedValue([]),
  getAssignment: vi.fn(),
  updateAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
  completeAssignment: vi.fn(),
}));
vi.mock("./services/workItemService", () => ({
  listWorkItemsForStudent: vi.fn().mockResolvedValue([]),
  listWorkItems: vi.fn().mockResolvedValue([]),
  createWorkItems: vi.fn(),
  deleteWorkItems: vi.fn(),
  completeAllForAssignment: vi.fn(),
}));
vi.mock("./services/decompositionAttemptService", () => ({
  recordDecompositionAttempt: vi.fn(),
}));
vi.mock("./services/reflectionService", () => ({
  recordReflection: vi.fn(),
}));

// Needed only for the "switches to the Plan tab" test below, which now
// mounts PlanPage (docs/features/daily-planning.md) — every other test
// in this file never visits that tab, so these all default to
// resolving empty.
vi.mock("./services/activityService", () => ({
  listActivities: vi.fn().mockResolvedValue([]),
  createActivity: vi.fn(),
  updateActivityDays: vi.fn(),
  deleteActivity: vi.fn(),
}));
vi.mock("./services/workSessionService", () => ({
  listWorkSessionsForDate: vi.fn().mockResolvedValue([]),
  listWorkSessionsForStudent: vi.fn().mockResolvedValue([]),
  createWorkSessions: vi.fn(),
  deletePlannedSessionsForDate: vi.fn(),
  deleteWorkSession: vi.fn(),
}));
vi.mock("./services/planningSessionService", () => ({
  recordPlanningSession: vi.fn(),
}));
vi.mock("./services/preferencesService", () => ({
  getPreferences: vi.fn().mockResolvedValue({ weekdayFinishTime: "21:00", weekendHours: 10 }),
  upsertPreferences: vi.fn(),
  DEFAULT_PREFERENCES: { weekdayFinishTime: "21:00", weekendHours: 10 },
}));

import * as courseService from "./services/courseService";
import * as assignmentService from "./services/assignmentService";
import * as workItemService from "./services/workItemService";
import * as workSessionService from "./services/workSessionService";

const mockedCourseService = courseService as unknown as {
  listCourses: ReturnType<typeof vi.fn>;
};
const mockedAssignmentService = assignmentService as unknown as {
  listAssignments: ReturnType<typeof vi.fn>;
  getAssignment: ReturnType<typeof vi.fn>;
  deleteAssignment: ReturnType<typeof vi.fn>;
};
const mockedWorkItemService = workItemService as unknown as {
  listWorkItemsForStudent: ReturnType<typeof vi.fn>;
};
const mockedWorkSessionService = workSessionService as unknown as {
  listWorkSessionsForDate: ReturnType<typeof vi.fn>;
};

// 2026-03-16 is a Monday — only used by the Today Execution test below,
// which needs a deterministic "today" to match Plan's own default
// selected date; every other test in this file is unaffected by the
// real current date.
const TODAY = new Date(2026, 2, 16, 9, 0, 0);
const TODAY_ISO = "2026-03-16";

beforeEach(() => {
  vi.mocked(useAuth).mockReset();
  vi.clearAllMocks();
  mockedCourseService.listCourses.mockResolvedValue([]);
  mockedAssignmentService.listAssignments.mockResolvedValue([]);
  mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("App", () => {
  it("renders the login page when there is no authenticated user", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);

    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  });

  it("renders the home page when a user is authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { email: "person@example.com" } as User,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);

    expect(screen.getByRole("heading", { name: /hi person\./i })).toBeInTheDocument();
  });

  it("switches to the Plan tab", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "student-1", email: "person@example.com" } as User,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "Plan" }));

    expect(
      await screen.findByRole("heading", { name: /^plan$/i }),
    ).toBeInTheDocument();
  });

  it("switches to the Assignments tab", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { email: "person@example.com" } as User,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "Assignments" }));

    expect(
      screen.getByRole("heading", { name: /^assignments$/i }),
    ).toBeInTheDocument();
  });

  it("tapping the Home tab returns to Home's landing view even when already on the Home tab", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { email: "person@example.com" } as User,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    render(<App />);

    // Navigate into a nested view within Home (Settings), without ever
    // leaving the "home" tab — this is what FINDING-AM-001 exercised via
    // Assignment Detail, reproduced here without extra service mocking.
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByRole("heading", { name: /^settings$/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Home" }));

    expect(screen.getByRole("heading", { name: /hi person\./i })).toBeInTheDocument();
  });

  it("tapping the Assignments tab returns to the Assignments list even when already on that tab", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "student-1", email: "person@example.com" } as User,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    mockedCourseService.listCourses.mockResolvedValue([
      { id: "course-1", name: "Biology", colorIndex: 0 },
    ]);
    const assignment = {
      id: "a1",
      courseId: "course-1",
      title: "Cell structure project",
      dueDate: "2026-08-22",
      effortMinutes: 60,
      notes: null,
      completedAt: null,
    };
    mockedAssignmentService.listAssignments.mockResolvedValue([assignment]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);

    render(<App />);

    // Reach a nested Assignment Detail screen from the Assignments list
    // itself, without ever leaving the "assignments" tab — this is what
    // FINDING-WB-001 exercised (distinct from FINDING-AM-001, which went
    // via Home's "+").
    await userEvent.click(screen.getByRole("button", { name: "Assignments" }));
    const card = await screen.findByText("Cell structure project");
    await userEvent.click(card.closest("button")!);
    expect(
      await screen.findByRole("heading", { name: "Cell structure project" }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Assignments" }));

    expect(
      await screen.findByRole("heading", { name: /^assignments$/i }),
    ).toBeInTheDocument();
  });

  it("tapping any tab exits Today Execution instead of leaving it stuck on top", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(TODAY);
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "student-1", email: "person@example.com" } as User,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    mockedCourseService.listCourses.mockResolvedValue([
      { id: "course-1", name: "Biology", colorIndex: 0 },
    ]);
    mockedAssignmentService.listAssignments.mockResolvedValue([
      {
        id: "a1",
        courseId: "course-1",
        title: "Essay",
        dueDate: "2026-03-20",
        effortMinutes: 30,
        notes: null,
        completedAt: null,
      },
    ]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([
      {
        id: "w1",
        assignmentId: "a1",
        title: "Draft outline",
        effortMinutes: 30,
        completedAt: null,
        position: 0,
      },
    ]);
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
      {
        id: "s1",
        workItemId: "w1",
        date: TODAY_ISO,
        plannedMinutes: 30,
        startTime: "16:00",
        status: "planned",
      },
    ]);
    const userEventInstance = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<App />);

    // Reach Today Execution via Plan's Day step (Plan defaults to
    // today) — same entry point docs/decisions/
    // 20260816-today-execution-interim-entry-point.md added.
    await userEventInstance.click(screen.getByRole("button", { name: "Plan" }));
    const continueButton = await screen.findByRole("button", {
      name: /continue today.s plan/i,
    });
    await userEventInstance.click(continueButton);
    expect(await screen.findByRole("heading", { name: /^today$/i })).toBeInTheDocument();

    await userEventInstance.click(screen.getByRole("button", { name: "Home" }));

    expect(await screen.findByRole("heading", { name: /hi person\./i })).toBeInTheDocument();
    // Today Execution's own action, not Home's — its absence confirms
    // Home actually replaced it rather than rendering underneath it.
    expect(
      screen.queryByRole("button", { name: /change today.s plan/i }),
    ).not.toBeInTheDocument();
  });

  it("opens Assignment Detail from Home, and Back returns to Home with freshly-refetched data", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "student-1", email: "person@example.com" } as User,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    mockedCourseService.listCourses.mockResolvedValue([
      { id: "course-1", name: "Biology", colorIndex: 0 },
    ]);
    const assignment = {
      id: "a1",
      courseId: "course-1",
      title: "Reading response",
      dueDate: "2026-08-22",
      effortMinutes: 60,
      notes: null,
      completedAt: null,
    };
    mockedAssignmentService.listAssignments.mockResolvedValue([assignment]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);

    render(<App />);

    // Home's own "Coming up" list — a second, independent entry point
    // into Assignment Detail from the one Assignments-tab exercises
    // above, previously a separate local view inside HomePage with no
    // refetch-on-back (see docs/decisions/
    // 20260817-assignment-detail-global-overlay.md).
    await userEvent.click(await screen.findByRole("button", { name: /reading response/i }));
    expect(
      await screen.findByRole("heading", { name: "Reading response" }),
    ).toBeInTheDocument();
    const fetchCountBeforeBack = mockedAssignmentService.listAssignments.mock.calls.length;

    await userEvent.click(screen.getByRole("button", { name: /back/i }));

    expect(await screen.findByRole("heading", { name: /hi person\./i })).toBeInTheDocument();
    // Returning to Home remounts it (same ternary-replace shape as Today
    // Execution), which refetches automatically — no stale data left
    // over from whatever Detail may have changed.
    expect(mockedAssignmentService.listAssignments.mock.calls.length).toBeGreaterThan(
      fetchCountBeforeBack,
    );
  });

  it("tapping a tab exits Assignment Detail instead of leaving it stuck on top", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "student-1", email: "person@example.com" } as User,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    mockedCourseService.listCourses.mockResolvedValue([
      { id: "course-1", name: "Biology", colorIndex: 0 },
    ]);
    const assignment = {
      id: "a1",
      courseId: "course-1",
      title: "Cell structure project",
      dueDate: "2026-08-22",
      effortMinutes: 60,
      notes: null,
      completedAt: null,
    };
    mockedAssignmentService.listAssignments.mockResolvedValue([assignment]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);

    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "Assignments" }));
    const card = await screen.findByText("Cell structure project");
    await userEvent.click(card.closest("button")!);
    expect(
      await screen.findByRole("heading", { name: "Cell structure project" }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Home" }));

    expect(await screen.findByRole("heading", { name: /hi person\./i })).toBeInTheDocument();
  });

  describe("deleting an assignment from Detail", () => {
    const assignment = {
      id: "a1",
      courseId: "course-1",
      title: "Chapter 7 problem set",
      dueDate: "2026-08-22",
      effortMinutes: 30,
      notes: null,
      completedAt: null,
    };

    function setUp() {
      vi.mocked(useAuth).mockReturnValue({
        user: { id: "student-1", email: "person@example.com" } as User,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      });
      mockedCourseService.listCourses.mockResolvedValue([
        { id: "course-1", name: "Biology", colorIndex: 0 },
      ]);
      mockedAssignmentService.listAssignments.mockResolvedValue([assignment]);
      mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
      mockedAssignmentService.deleteAssignment.mockResolvedValue(undefined);
    }

    async function openDetailAndDelete(userEventInstance: ReturnType<typeof userEvent.setup>) {
      render(<App />);
      await userEventInstance.click(screen.getByRole("button", { name: "Assignments" }));
      const card = await screen.findByText("Chapter 7 problem set");
      await userEventInstance.click(card.closest("button")!);
      await screen.findByRole("heading", { name: "Chapter 7 problem set" });
      await userEventInstance.click(
        screen.getByRole("button", { name: /delete assignment/i }),
      );
    }

    it("shows an Undo toast and defers the real delete, regardless of which tab launched Detail", async () => {
      setUp();
      const userEventInstance = userEvent.setup();

      await openDetailAndDelete(userEventInstance);

      expect(await screen.findByRole("heading", { name: /^assignments$/i })).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent(/chapter 7 problem set.*deleted/i);
      expect(mockedAssignmentService.deleteAssignment).not.toHaveBeenCalled();
    });

    it("commits the delete once the Undo window elapses", async () => {
      setUp();
      const userEventInstance = userEvent.setup();
      // Spy on the real setTimeout rather than replacing the whole timer
      // subsystem (vi.useFakeTimers) — this avoids interfering with
      // user-event's and React's own internal scheduling.
      const setTimeoutSpy = vi.spyOn(window, "setTimeout");

      await openDetailAndDelete(userEventInstance);
      expect(mockedAssignmentService.deleteAssignment).not.toHaveBeenCalled();

      const undoTimerCall = setTimeoutSpy.mock.calls.find(([, ms]) => ms === 5000);
      (undoTimerCall![0] as () => void)();

      await waitFor(() =>
        expect(mockedAssignmentService.deleteAssignment).toHaveBeenCalledWith("a1"),
      );
      setTimeoutSpy.mockRestore();
    });

    it("Undo cancels the pending delete and never calls the server", async () => {
      setUp();
      const userEventInstance = userEvent.setup();

      await openDetailAndDelete(userEventInstance);
      await userEventInstance.click(screen.getByRole("button", { name: /^undo$/i }));

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(mockedAssignmentService.deleteAssignment).not.toHaveBeenCalled();
    });
  });
});
