import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
  updateWorkSessionStatus: vi.fn().mockResolvedValue(undefined),
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

    // Reach Today Execution via Home's own Next card — the sole entry
    // point now that Plan's "Continue today's plan" has been removed
    // (docs/decisions/20260816-today-execution-interim-entry-point.md).
    const startButton = await screen.findByRole("button", { name: "Start" });
    await userEventInstance.click(startButton);
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

  it("opening Assignment Detail from Plan's Look ahead tab and tapping Back returns to Look ahead, not the wizard", async () => {
    // Regression test: planTab used to be PlanPage's own local state, so
    // the remount an Assignment Detail round trip causes reset it back to
    // "wizard" every time — discovered live while testing week-lookahead.md.
    // See the tab/onTabChange wiring in App.tsx and docs/decisions/
    // 20260817-assignment-detail-global-overlay.md.
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
      title: "Essay",
      dueDate: "2026-08-17",
      effortMinutes: 60,
      notes: null,
      completedAt: null,
    };
    mockedAssignmentService.listAssignments.mockResolvedValue([assignment]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);

    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "Plan" }));
    await userEvent.click(await screen.findByRole("tab", { name: /look ahead/i }));
    await userEvent.click(await screen.findByRole("button", { name: /due: essay/i }));
    expect(await screen.findByRole("heading", { name: "Essay" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /back/i }));

    expect(await screen.findByRole("tab", { name: /look ahead/i, selected: true })).toBeInTheDocument();
    expect(screen.queryByText(/step 1 of 5/i)).not.toBeInTheDocument();
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
    // Every delete requires this in-card/in-page confirmation, regardless
    // of completed-steps state or which tab Detail was reached from — see
    // docs/decisions/20260817-remove-undo-delete.md. Simpler than the
    // Undo-window soft-delete it replaced, which could only track one
    // pending delete at a time and left a real bug (found live in the
    // browser) where a completed delete could keep showing indefinitely
    // on whichever tab it was launched from.
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

    it("requires confirmation, then deletes and returns to Assignments", async () => {
      setUp();
      const userEventInstance = userEvent.setup();

      render(<App />);
      await userEventInstance.click(screen.getByRole("button", { name: "Assignments" }));
      const card = await screen.findByText("Chapter 7 problem set");
      await userEventInstance.click(card.closest("button")!);
      await screen.findByRole("heading", { name: "Chapter 7 problem set" });
      await userEventInstance.click(
        screen.getByRole("button", { name: /delete assignment/i }),
      );

      expect(await screen.findByText(/delete this assignment\?/i)).toBeInTheDocument();
      expect(mockedAssignmentService.deleteAssignment).not.toHaveBeenCalled();

      await userEventInstance.click(screen.getByRole("button", { name: /^delete$/i }));

      expect(await screen.findByRole("heading", { name: /^assignments$/i })).toBeInTheDocument();
      expect(mockedAssignmentService.deleteAssignment).toHaveBeenCalledWith("a1");
    });

    it("requires confirmation when reached via Home too, and returns to Home once confirmed", async () => {
      setUp();
      const userEventInstance = userEvent.setup();

      render(<App />);
      // Reach Detail via Home's own Coming Up list this time, not
      // Assignments — the confirmation must behave identically regardless
      // of entry point.
      await userEventInstance.click(
        await screen.findByRole("button", { name: /chapter 7 problem set/i }),
      );
      await screen.findByRole("heading", { name: "Chapter 7 problem set" });
      await userEventInstance.click(
        screen.getByRole("button", { name: /delete assignment/i }),
      );
      await screen.findByText(/delete this assignment\?/i);
      // Home remounts on return, which refetches — reflect the delete in
      // that next fetch, the same way the real server would.
      mockedAssignmentService.listAssignments.mockResolvedValue([]);
      await userEventInstance.click(screen.getByRole("button", { name: /^delete$/i }));

      expect(await screen.findByRole("heading", { name: /hi person\./i })).toBeInTheDocument();
      expect(mockedAssignmentService.deleteAssignment).toHaveBeenCalledWith("a1");
      // Home remounts on return (same as any Assignment Detail round
      // trip), so the now-deleted assignment is simply gone from its
      // fresh fetch — no special hiding logic required.
      expect(
        screen.queryByRole("button", { name: /chapter 7 problem set/i }),
      ).not.toBeInTheDocument();
    });

    it("cancelling the confirmation leaves the assignment untouched and Detail open", async () => {
      setUp();
      const userEventInstance = userEvent.setup();

      render(<App />);
      await userEventInstance.click(screen.getByRole("button", { name: "Assignments" }));
      const card = await screen.findByText("Chapter 7 problem set");
      await userEventInstance.click(card.closest("button")!);
      await screen.findByRole("heading", { name: "Chapter 7 problem set" });
      await userEventInstance.click(
        screen.getByRole("button", { name: /delete assignment/i }),
      );
      await screen.findByText(/delete this assignment\?/i);
      await userEventInstance.click(screen.getByRole("button", { name: /^cancel$/i }));

      expect(
        screen.getByRole("heading", { name: "Chapter 7 problem set" }),
      ).toBeInTheDocument();
      expect(mockedAssignmentService.deleteAssignment).not.toHaveBeenCalled();
    });
  });
});
