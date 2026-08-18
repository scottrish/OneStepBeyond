import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "@supabase/supabase-js";
import HomePage from "./HomePage";

vi.mock("../services/courseService", () => ({
  listCourses: vi.fn().mockResolvedValue([]),
  createCourse: vi.fn(),
  renameCourse: vi.fn(),
}));

vi.mock("../services/assignmentService", () => ({
  listAssignments: vi.fn().mockResolvedValue([]),
  createAssignment: vi.fn(),
  getAssignment: vi.fn(),
}));

vi.mock("../services/workItemService", () => ({
  listWorkItemsForStudent: vi.fn().mockResolvedValue([]),
}));

vi.mock("../services/activityService", () => ({
  listActivities: vi.fn().mockResolvedValue([]),
  createActivity: vi.fn(),
  updateActivityDays: vi.fn(),
  deleteActivity: vi.fn(),
}));

vi.mock("../services/workSessionService", () => ({
  listWorkSessionsForDate: vi.fn().mockResolvedValue([]),
  listWorkSessionsForStudent: vi.fn().mockResolvedValue([]),
  updateWorkSessionStatus: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../services/preferencesService", () => ({
  getPreferences: vi.fn(),
  upsertPreferences: vi.fn(),
  DEFAULT_PREFERENCES: { weekdayFinishTime: "21:00", weekendHours: 10 },
}));

import * as courseService from "../services/courseService";
import * as assignmentService from "../services/assignmentService";
import * as workItemService from "../services/workItemService";
import * as activityService from "../services/activityService";
import * as workSessionService from "../services/workSessionService";
import * as preferencesService from "../services/preferencesService";

const mockedCourseService = courseService as unknown as {
  listCourses: ReturnType<typeof vi.fn>;
};
const mockedAssignmentService = assignmentService as unknown as {
  listAssignments: ReturnType<typeof vi.fn>;
};
const mockedWorkItemService = workItemService as unknown as {
  listWorkItemsForStudent: ReturnType<typeof vi.fn>;
};
const mockedActivityService = activityService as unknown as {
  listActivities: ReturnType<typeof vi.fn>;
};
const mockedWorkSessionService = workSessionService as unknown as {
  listWorkSessionsForDate: ReturnType<typeof vi.fn>;
  listWorkSessionsForStudent: ReturnType<typeof vi.fn>;
  updateWorkSessionStatus: ReturnType<typeof vi.fn>;
};
const mockedPreferencesService = preferencesService as unknown as {
  getPreferences: ReturnType<typeof vi.fn>;
  upsertPreferences: ReturnType<typeof vi.fn>;
};

const user = { id: "student-1", email: "person@example.com" } as User;
const course = { id: "course-1", name: "Biology", colorIndex: 0 };

// 2026-03-16 is a Monday — fixed so "due soon"/capacity math and the
// header's date line are deterministic regardless of the real current
// date, matching PlanPage.test.tsx's own convention.
const TODAY = new Date(2026, 2, 16, 9, 0, 0);
const TODAY_ISO = "2026-03-16";

function renderHomePage(overrides: Record<string, unknown> = {}) {
  return render(
    <HomePage
      user={user}
      signOut={vi.fn()}
      onStartExecution={vi.fn()}
      onGoToPlan={vi.fn()}
      onGoToAssignments={vi.fn()}
      onOpenAssignment={vi.fn()}
      {...overrides}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(TODAY);
  mockedCourseService.listCourses.mockResolvedValue([]);
  mockedAssignmentService.listAssignments.mockResolvedValue([]);
  mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([]);
  mockedActivityService.listActivities.mockResolvedValue([]);
  mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([]);
  mockedWorkSessionService.listWorkSessionsForStudent.mockResolvedValue([]);
  mockedWorkSessionService.updateWorkSessionStatus.mockResolvedValue(undefined);
  mockedPreferencesService.getPreferences.mockResolvedValue({
    weekdayFinishTime: "21:00",
    weekendHours: 10,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("HomePage", () => {
  it("greets the student by a name derived from their email, not the raw address", async () => {
    renderHomePage();

    expect(await screen.findByRole("heading", { name: /hi person\./i })).toBeInTheDocument();
    expect(screen.queryByText(/person@example\.com/)).not.toBeInTheDocument();
  });

  it("navigates to Settings when the settings button is clicked", async () => {
    renderHomePage();

    await userEvent.click(screen.getByRole("button", { name: /settings/i }));

    expect(
      await screen.findByRole("heading", { name: /settings/i }),
    ).toBeInTheDocument();
  });

  it("navigates to Courses from Settings", async () => {
    renderHomePage();

    await userEvent.click(screen.getByRole("button", { name: /settings/i }));
    await userEvent.click(screen.getByRole("button", { name: /courses/i }));

    expect(await screen.findByRole("heading", { name: /courses/i })).toBeInTheDocument();
  });

  it("navigates to Activities from Settings", async () => {
    renderHomePage();

    await userEvent.click(screen.getByRole("button", { name: /settings/i }));
    await userEvent.click(screen.getByRole("button", { name: /activities/i }));

    expect(
      await screen.findByRole("heading", { name: /activities/i }),
    ).toBeInTheDocument();
  });

  it("calls signOut from Settings", async () => {
    const signOut = vi.fn();
    renderHomePage({ signOut });

    await userEvent.click(screen.getByRole("button", { name: /settings/i }));
    await userEvent.click(screen.getByRole("button", { name: /sign out/i }));

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("navigates to New Assignment when the + button is clicked", async () => {
    renderHomePage();

    await userEvent.click(
      screen.getByRole("button", { name: /new assignment/i }),
    );

    expect(
      await screen.findByRole("heading", { name: /new assignment/i }),
    ).toBeInTheDocument();
  });

  describe("Next card", () => {
    it("shows the next not-done planned item for today with its assignment/course context and a Start CTA", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        {
          id: "a1",
          courseId: "course-1",
          title: "Cell structure project",
          dueDate: "2026-03-25",
          effortMinutes: 60,
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
      mockedCourseService.listCourses.mockResolvedValue([course]);
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
      const onStartExecution = vi.fn();

      renderHomePage({ onStartExecution });

      expect(await screen.findByText("Draft outline")).toBeInTheDocument();
      expect(screen.getByText(/cell structure project · biology/i)).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: /^start$/i }));
      expect(onStartExecution).toHaveBeenCalledTimes(1);
    });

    it("marks the session in progress before navigating, so Today Execution never asks to Start it again", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        {
          id: "a1",
          courseId: "course-1",
          title: "Cell structure project",
          dueDate: "2026-03-25",
          effortMinutes: 60,
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
      mockedCourseService.listCourses.mockResolvedValue([course]);
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

      renderHomePage();

      await screen.findByText("Draft outline");
      await userEvent.click(screen.getByRole("button", { name: /^start$/i }));

      expect(mockedWorkSessionService.updateWorkSessionStatus).toHaveBeenCalledWith(
        "s1",
        "in_progress",
      );
    });

    it("shows 'Continue' instead of 'Start' once the session is already in progress, and doesn't re-issue the status update", async () => {
      // Regression test: the Next card's button used to always read
      // "Start" regardless of the session's actual status, even after
      // this same button had already marked it in_progress — the button
      // itself never reflected the transition it performs.
      mockedAssignmentService.listAssignments.mockResolvedValue([
        {
          id: "a1",
          courseId: "course-1",
          title: "Cell structure project",
          dueDate: "2026-03-25",
          effortMinutes: 60,
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
      mockedCourseService.listCourses.mockResolvedValue([course]);
      mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
        {
          id: "s1",
          workItemId: "w1",
          date: TODAY_ISO,
          plannedMinutes: 30,
          startTime: "16:00",
          status: "in_progress",
        },
      ]);
      const onStartExecution = vi.fn();

      renderHomePage({ onStartExecution });

      await screen.findByText("Draft outline");
      expect(screen.queryByRole("button", { name: /^start$/i })).not.toBeInTheDocument();
      const continueButton = screen.getByRole("button", { name: /^continue$/i });

      await userEvent.click(continueButton);

      expect(mockedWorkSessionService.updateWorkSessionStatus).not.toHaveBeenCalled();
      expect(onStartExecution).toHaveBeenCalledTimes(1);
    });

    it("opens Assignment Detail when the Next card's assignment/course line is tapped", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        {
          id: "a1",
          courseId: "course-1",
          title: "Cell structure project",
          dueDate: "2026-03-25",
          effortMinutes: 60,
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
      mockedCourseService.listCourses.mockResolvedValue([course]);
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
      const onOpenAssignment = vi.fn();

      renderHomePage({ onOpenAssignment });

      await userEvent.click(
        await screen.findByRole("button", { name: /cell structure project · biology/i }),
      );
      expect(onOpenAssignment).toHaveBeenCalledWith("a1");
    });

    it("shows today's remaining planned tasks under 'After that', not just a count", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        {
          id: "a1",
          courseId: "course-1",
          title: "Cell structure project",
          dueDate: "2026-03-25",
          effortMinutes: 60,
          notes: null,
          completedAt: null,
        },
      ]);
      mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([
        { id: "w1", assignmentId: "a1", title: "Draft outline", effortMinutes: 30, completedAt: null, position: 0 },
        { id: "w2", assignmentId: "a1", title: "Write conclusion", effortMinutes: 20, completedAt: null, position: 1 },
      ]);
      mockedCourseService.listCourses.mockResolvedValue([course]);
      mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
        { id: "s1", workItemId: "w1", date: TODAY_ISO, plannedMinutes: 30, startTime: "16:00", status: "planned" },
        { id: "s2", workItemId: "w2", date: TODAY_ISO, plannedMinutes: 20, startTime: "17:00", status: "planned" },
      ]);

      renderHomePage();

      await screen.findByText("Draft outline");
      expect(screen.getByRole("heading", { name: /after that/i })).toBeInTheDocument();
      expect(screen.getByText("Write conclusion")).toBeInTheDocument();
    });

    it("shows no 'After that' section when only one task is planned for today", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        {
          id: "a1",
          courseId: "course-1",
          title: "Cell structure project",
          dueDate: "2026-03-25",
          effortMinutes: 60,
          notes: null,
          completedAt: null,
        },
      ]);
      mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([
        { id: "w1", assignmentId: "a1", title: "Draft outline", effortMinutes: 30, completedAt: null, position: 0 },
      ]);
      mockedCourseService.listCourses.mockResolvedValue([course]);
      mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
        { id: "s1", workItemId: "w1", date: TODAY_ISO, plannedMinutes: 30, startTime: "16:00", status: "planned" },
      ]);

      renderHomePage();

      await screen.findByText("Draft outline");
      expect(screen.queryByRole("heading", { name: /after that/i })).not.toBeInTheDocument();
    });

    it("shows an empty state inviting planning when nothing is planned for today", async () => {
      const onGoToPlan = vi.fn();
      renderHomePage({ onGoToPlan });

      expect(await screen.findByText(/no plan for today yet/i)).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: /plan today/i }));
      expect(onGoToPlan).toHaveBeenCalledTimes(1);
    });

    it("shows a calm all-done confirmation, not the empty state, once every planned session for today is done", async () => {
      mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([
        {
          id: "w1",
          assignmentId: "a1",
          title: "Draft outline",
          effortMinutes: 30,
          completedAt: "2026-03-16T00:00:00Z",
          position: 0,
        },
        {
          id: "w2",
          assignmentId: "a1",
          title: "Write conclusion",
          effortMinutes: 30,
          completedAt: "2026-03-16T00:00:00Z",
          position: 1,
        },
      ]);
      mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
        {
          id: "s1",
          workItemId: "w1",
          date: TODAY_ISO,
          plannedMinutes: 30,
          startTime: "16:00",
          status: "done",
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

      renderHomePage();

      expect(await screen.findByText(/that.s everything for today/i)).toBeInTheDocument();
      expect(
        screen.getByText(/you did what you said you would\. the evening is yours\./i),
      ).toBeInTheDocument();
      expect(screen.queryByText(/no plan for today yet/i)).not.toBeInTheDocument();
      // The stale "Today's plan: ... tasks" summary shouldn't linger
      // once everything it describes is already finished.
      expect(screen.queryByText(/today.s plan:/i)).not.toBeInTheDocument();
    });
  });

  describe("Today's plan summary", () => {
    function planSessions() {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        {
          id: "a1",
          courseId: "course-1",
          title: "Cell structure project",
          dueDate: "2026-03-25",
          effortMinutes: 60,
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
        {
          id: "w2",
          assignmentId: "a1",
          title: "Write conclusion",
          effortMinutes: 30,
          completedAt: null,
          position: 1,
        },
      ]);
      mockedCourseService.listCourses.mockResolvedValue([course]);
    }

    it("names the next activity as \"before {activity}\" when the plan is genuinely scheduled ahead of it", async () => {
      planSessions();
      mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
        { id: "s1", workItemId: "w1", date: TODAY_ISO, plannedMinutes: 30, startTime: "14:00", status: "planned" },
        { id: "s2", workItemId: "w2", date: TODAY_ISO, plannedMinutes: 30, startTime: "14:30", status: "planned" },
      ]);
      mockedActivityService.listActivities.mockResolvedValue([
        {
          id: "act-1",
          name: "Football practice",
          days: [1],
          startTime: "16:00",
          finishTime: "17:00",
          travelToMinutes: 0,
          travelFromMinutes: 0,
        },
      ]);

      renderHomePage();

      expect(await screen.findByText(/before football practice/i)).toBeInTheDocument();
    });

    it("does not claim the plan is \"before\" an activity it's actually scheduled after", async () => {
      // Reproduces the reported bug: both tasks are scheduled after
      // Football practice, but the summary named it anyway because it
      // used to grab the day's first activity unconditionally instead of
      // checking session times against it.
      planSessions();
      mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
        { id: "s1", workItemId: "w1", date: TODAY_ISO, plannedMinutes: 30, startTime: "18:00", status: "planned" },
        { id: "s2", workItemId: "w2", date: TODAY_ISO, plannedMinutes: 30, startTime: "18:30", status: "planned" },
      ]);
      mockedActivityService.listActivities.mockResolvedValue([
        {
          id: "act-1",
          name: "Football practice",
          days: [1],
          startTime: "16:00",
          finishTime: "17:00",
          travelToMinutes: 0,
          travelFromMinutes: 0,
        },
      ]);

      renderHomePage();

      await screen.findByText(/today.s plan:/i);
      expect(screen.queryByText(/before football practice/i)).not.toBeInTheDocument();
    });

    it("names a later activity the plan is genuinely before, skipping one it's scheduled after", async () => {
      planSessions();
      mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
        { id: "s1", workItemId: "w1", date: TODAY_ISO, plannedMinutes: 30, startTime: "18:00", status: "planned" },
        { id: "s2", workItemId: "w2", date: TODAY_ISO, plannedMinutes: 30, startTime: "18:30", status: "planned" },
      ]);
      mockedActivityService.listActivities.mockResolvedValue([
        {
          id: "act-1",
          name: "Football practice",
          days: [1],
          startTime: "16:00",
          finishTime: "17:00",
          travelToMinutes: 0,
          travelFromMinutes: 0,
        },
        {
          id: "act-2",
          name: "Dinner",
          days: [1],
          startTime: "20:00",
          finishTime: "20:30",
          travelToMinutes: 0,
          travelFromMinutes: 0,
        },
      ]);

      renderHomePage();

      expect(await screen.findByText(/before dinner/i)).toBeInTheDocument();
      expect(screen.queryByText(/before football practice/i)).not.toBeInTheDocument();
    });
  });

  describe("Needs Attention", () => {
    it("shows the soonest-due item prominently, with its specific action, never a bare warning", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        {
          id: "a1",
          courseId: "course-1",
          title: "Big project",
          dueDate: "2026-03-16",
          effortMinutes: 5000,
          notes: null,
          completedAt: null,
        },
      ]);
      mockedCourseService.listCourses.mockResolvedValue([course]);

      renderHomePage();

      expect(await screen.findByText(/needs attention/i)).toBeInTheDocument();
      expect(
        screen.getByText(/due soon and nothing planned for it yet/i),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /break it down/i })).toBeInTheDocument();
    });

    it("'Break it down' routes to Plan, the same as 'Find time'/'Make a plan', instead of opening Assignment Detail directly", async () => {
      // docs/features/home-dashboard-followthrough.md item 2 — Plan's own
      // Day step already shows every assignment needing a breakdown with
      // the full "Break down / Plan as one task instead" choice, so
      // routing there gives the identical experience Plan itself offers.
      mockedAssignmentService.listAssignments.mockResolvedValue([
        {
          id: "a1",
          courseId: "course-1",
          title: "Big project",
          dueDate: "2026-03-16",
          effortMinutes: 5000,
          notes: null,
          completedAt: null,
        },
      ]);
      mockedCourseService.listCourses.mockResolvedValue([course]);
      const onGoToPlan = vi.fn();
      const onOpenAssignment = vi.fn();

      renderHomePage({ onGoToPlan, onOpenAssignment });

      await userEvent.click(await screen.findByRole("button", { name: /break it down/i }));

      expect(onGoToPlan).toHaveBeenCalledTimes(1);
      expect(onOpenAssignment).not.toHaveBeenCalled();
    });

    it("shows every additional qualifying assignment as a compact row with its own action, not just the soonest", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        {
          id: "a1",
          courseId: "course-1",
          title: "Big project",
          dueDate: "2026-03-16",
          effortMinutes: 5000,
          notes: null,
          completedAt: null,
        },
        {
          id: "a2",
          courseId: "course-1",
          title: "Smaller project",
          dueDate: "2026-03-17",
          effortMinutes: 5000,
          notes: null,
          completedAt: null,
        },
      ]);
      mockedCourseService.listCourses.mockResolvedValue([course]);
      const onOpenAssignment = vi.fn();
      const onGoToPlan = vi.fn();

      renderHomePage({ onOpenAssignment, onGoToPlan });

      await screen.findByText(/needs attention/i);
      // "Big project" (due first) is the primary card; "Smaller project"
      // must still be visible and actionable, not silently dropped.
      const secondaryRow = screen.getByRole("button", { name: "Smaller project" });
      expect(secondaryRow).toBeInTheDocument();

      await userEvent.click(secondaryRow);
      expect(onOpenAssignment).toHaveBeenCalledWith("a2");

      const secondaryActionButtons = screen.getAllByRole("button", { name: /break it down/i });
      // One for the primary card, one for the secondary row.
      expect(secondaryActionButtons).toHaveLength(2);
      await userEvent.click(secondaryActionButtons[1]!);
      expect(onGoToPlan).toHaveBeenCalledTimes(1);
    });

    it("opens Assignment Detail when the Needs Attention item's title is tapped", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        {
          id: "a1",
          courseId: "course-1",
          title: "Big project",
          dueDate: "2026-03-16",
          effortMinutes: 5000,
          notes: null,
          completedAt: null,
        },
      ]);
      mockedCourseService.listCourses.mockResolvedValue([course]);
      const onOpenAssignment = vi.fn();

      renderHomePage({ onOpenAssignment });

      await userEvent.click(await screen.findByRole("button", { name: "Big project" }));
      expect(onOpenAssignment).toHaveBeenCalledWith("a1");
    });

    it("shows nothing when no assignment qualifies — silence is the on-track state", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        {
          id: "a1",
          courseId: "course-1",
          title: "Reading",
          dueDate: "2026-04-30",
          effortMinutes: 20,
          notes: null,
          completedAt: null,
        },
      ]);
      mockedCourseService.listCourses.mockResolvedValue([course]);

      renderHomePage();

      await screen.findByText("Reading");
      expect(screen.queryByText(/needs attention/i)).not.toBeInTheDocument();
    });
  });

  describe("Coming up", () => {
    it("lists open assignments by due date, including whatever Needs Attention is also showing", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        {
          id: "urgent",
          courseId: "course-1",
          title: "Big project",
          dueDate: "2026-03-16",
          effortMinutes: 5000,
          notes: null,
          completedAt: null,
        },
        {
          id: "ordinary",
          courseId: "course-1",
          title: "Reading response",
          dueDate: "2026-04-30",
          effortMinutes: 20,
          notes: null,
          completedAt: null,
        },
      ]);
      mockedCourseService.listCourses.mockResolvedValue([course]);

      renderHomePage();

      await screen.findByText(/needs attention/i);
      // "Big project" is also the Needs Attention item — Coming Up shows
      // it too, rather than hiding it, so it stays reachable the same way
      // every other assignment is (docs/decisions/
      // 20260817-coming-up-shows-attention-items.md).
      const comingUpHeading = screen.getByRole("heading", { name: /coming up/i });
      const comingUpSection = comingUpHeading.closest("div") as HTMLElement;
      expect(comingUpSection).toHaveTextContent("Big project");
      expect(comingUpSection).toHaveTextContent("Reading response");
    });

    it("shows each item's class alongside its title, not the title alone", async () => {
      // docs/features/observations.md — "Coming up" items were
      // identifiable only by assignment title, with no indication of
      // which class they belonged to.
      mockedAssignmentService.listAssignments.mockResolvedValue([
        {
          id: "ordinary",
          courseId: "course-1",
          title: "Reading response",
          dueDate: "2026-04-30",
          effortMinutes: 20,
          notes: null,
          completedAt: null,
        },
      ]);
      mockedCourseService.listCourses.mockResolvedValue([course]);

      renderHomePage();

      const comingUpHeading = await screen.findByRole("heading", { name: /coming up/i });
      const comingUpSection = comingUpHeading.closest("div") as HTMLElement;
      expect(comingUpSection).toHaveTextContent("Reading response");
      expect(comingUpSection).toHaveTextContent("Biology");
    });

    it("invites capturing a first assignment when there are none", async () => {
      renderHomePage();

      expect(await screen.findByText(/nothing coming up/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /add an assignment/i }),
      ).toBeInTheDocument();
    });

    it("opens Assignment Detail when a Coming Up item is tapped", async () => {
      mockedAssignmentService.listAssignments.mockResolvedValue([
        {
          id: "ordinary",
          courseId: "course-1",
          title: "Reading response",
          dueDate: "2026-04-30",
          effortMinutes: 20,
          notes: null,
          completedAt: null,
        },
      ]);
      mockedCourseService.listCourses.mockResolvedValue([course]);
      const onOpenAssignment = vi.fn();

      renderHomePage({ onOpenAssignment });

      await userEvent.click(await screen.findByRole("button", { name: /reading response/i }));
      expect(onOpenAssignment).toHaveBeenCalledWith("ordinary");
    });
  });
});
