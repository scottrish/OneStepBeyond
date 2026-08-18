import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "@supabase/supabase-js";

vi.mock("../services/courseService", () => ({
  listCourses: vi.fn(),
  createCourse: vi.fn(),
  renameCourse: vi.fn(),
}));

vi.mock("../services/assignmentService", () => ({
  createAssignment: vi.fn(),
  getAssignment: vi.fn(),
  updateAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
  completeAssignment: vi.fn(),
}));

vi.mock("../services/workItemService", () => ({
  listWorkItems: vi.fn(),
  createWorkItems: vi.fn(),
  updateWorkItem: vi.fn(),
  deleteWorkItems: vi.fn(),
  completeAllForAssignment: vi.fn(),
}));

vi.mock("../services/decompositionAttemptService", () => ({
  recordDecompositionAttempt: vi.fn(),
}));

vi.mock("../services/reflectionService", () => ({
  recordReflection: vi.fn(),
}));

vi.mock("../services/activityService", () => ({
  listActivities: vi.fn(),
}));

vi.mock("../services/workSessionService", () => ({
  listWorkSessionsForStudent: vi.fn(),
}));

vi.mock("../services/preferencesService", () => ({
  getPreferences: vi.fn(),
  DEFAULT_PREFERENCES: { weekdayFinishTime: "21:00", weekendHours: 10 },
}));

import * as courseService from "../services/courseService";
import * as assignmentService from "../services/assignmentService";
import * as workItemService from "../services/workItemService";
import * as decompositionAttemptService from "../services/decompositionAttemptService";
import * as activityService from "../services/activityService";
import * as workSessionService from "../services/workSessionService";
import * as preferencesService from "../services/preferencesService";
import AssignmentDetailPage from "./AssignmentDetailPage";

const mockedCourseService = courseService as unknown as {
  listCourses: ReturnType<typeof vi.fn>;
};
const mockedAssignmentService = assignmentService as unknown as {
  getAssignment: ReturnType<typeof vi.fn>;
  updateAssignment: ReturnType<typeof vi.fn>;
  deleteAssignment: ReturnType<typeof vi.fn>;
  completeAssignment: ReturnType<typeof vi.fn>;
};
const mockedWorkItemService = workItemService as unknown as {
  listWorkItems: ReturnType<typeof vi.fn>;
  createWorkItems: ReturnType<typeof vi.fn>;
  updateWorkItem: ReturnType<typeof vi.fn>;
  deleteWorkItems: ReturnType<typeof vi.fn>;
  completeAllForAssignment: ReturnType<typeof vi.fn>;
};
const mockedDecompositionAttemptService = decompositionAttemptService as unknown as {
  recordDecompositionAttempt: ReturnType<typeof vi.fn>;
};
const mockedActivityService = activityService as unknown as {
  listActivities: ReturnType<typeof vi.fn>;
};
const mockedWorkSessionService = workSessionService as unknown as {
  listWorkSessionsForStudent: ReturnType<typeof vi.fn>;
};
const mockedPreferencesService = preferencesService as unknown as {
  getPreferences: ReturnType<typeof vi.fn>;
};

const user = { id: "student-1", email: "person@example.com" } as User;

const assignment = {
  id: "assignment-1",
  courseId: "course-1",
  title: "Chapter 7 problem set",
  dueDate: "2026-03-15",
  effortMinutes: 30,
  notes: "Bring a calculator",
  completedAt: null,
};

const preferences = { weekdayFinishTime: "21:00", weekendHours: 10 };

beforeEach(() => {
  vi.clearAllMocks();
  mockedWorkItemService.listWorkItems.mockResolvedValue([]);
  mockedActivityService.listActivities.mockResolvedValue([]);
  mockedWorkSessionService.listWorkSessionsForStudent.mockResolvedValue([]);
  mockedPreferencesService.getPreferences.mockResolvedValue(preferences);
});

describe("AssignmentDetailPage", () => {
  it("shows the assignment's course, title, due date, remaining time, and notes", async () => {
    mockedCourseService.listCourses.mockResolvedValue([
      { id: "course-1", name: "Biology", colorIndex: 0 },
    ]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);

    render(
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
    );

    expect(
      await screen.findByRole("heading", { name: "Chapter 7 problem set" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Biology")).toBeInTheDocument();
    expect(screen.getByText("March 15, 2026")).toBeInTheDocument();
    expect(screen.getByText("30m")).toBeInTheDocument();
    expect(screen.getByText("Bring a calculator")).toBeInTheDocument();
  });

  it("shows the original estimate alongside remaining time once a step exists", async () => {
    mockedCourseService.listCourses.mockResolvedValue([
      { id: "course-1", name: "Biology", colorIndex: 0 },
    ]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
    mockedWorkItemService.listWorkItems.mockResolvedValue([
      { id: "w1", assignmentId: "assignment-1", title: "Step 1", effortMinutes: 15, completedAt: null, position: 0 },
    ]);

    render(
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
    );

    expect(
      await screen.findByText(/15m of work left · you estimated 30m in total/i),
    ).toBeInTheDocument();
  });

  it("omits the notes section when there are no notes", async () => {
    mockedCourseService.listCourses.mockResolvedValue([
      { id: "course-1", name: "Biology", colorIndex: 0 },
    ]);
    mockedAssignmentService.getAssignment.mockResolvedValue({
      ...assignment,
      notes: null,
    });

    render(
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
    );

    await screen.findByRole("heading", { name: "Chapter 7 problem set" });
    expect(screen.queryByText(/notes/i)).not.toBeInTheDocument();
  });

  it("shows an error state when the assignment fails to load", async () => {
    mockedCourseService.listCourses.mockResolvedValue([]);
    mockedAssignmentService.getAssignment.mockRejectedValue({
      message: "not found",
    });

    render(
      <AssignmentDetailPage user={user} assignmentId="missing" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /couldn.t load this assignment/i,
    );
  });

  it("calls onBack when the back button is clicked", async () => {
    mockedCourseService.listCourses.mockResolvedValue([]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
    const onBack = vi.fn();
    const userEventInstance = userEvent.setup();

    render(
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={onBack} onGoToPlan={vi.fn()} />,
    );
    await screen.findByRole("heading", { name: "Chapter 7 problem set" });

    await userEventInstance.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("edits the assignment", async () => {
    mockedCourseService.listCourses.mockResolvedValue([
      { id: "course-1", name: "Biology", colorIndex: 0 },
    ]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
    mockedAssignmentService.updateAssignment.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup();

    render(
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
    );
    await screen.findByRole("heading", { name: "Chapter 7 problem set" });

    await userEventInstance.click(screen.getByRole("button", { name: /edit assignment/i }));
    const titleInput = screen.getByLabelText(/what is it\?/i);
    await userEventInstance.clear(titleInput);
    await userEventInstance.type(titleInput, "Chapter 8 problem set");
    await userEventInstance.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(mockedAssignmentService.updateAssignment).toHaveBeenCalledWith(
        "assignment-1",
        expect.objectContaining({ title: "Chapter 8 problem set" }),
      ),
    );
    expect(
      await screen.findByRole("heading", { name: "Chapter 8 problem set" }),
    ).toBeInTheDocument();
  });

  it("requires confirmation before deleting, even with no completed steps, and deletes only once confirmed", async () => {
    mockedCourseService.listCourses.mockResolvedValue([]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
    mockedAssignmentService.deleteAssignment.mockResolvedValue(undefined);
    const onBack = vi.fn();
    const userEventInstance = userEvent.setup();

    render(
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={onBack} onGoToPlan={vi.fn()} />,
    );
    await screen.findByRole("heading", { name: "Chapter 7 problem set" });

    await userEventInstance.click(screen.getByRole("button", { name: /delete assignment/i }));

    expect(await screen.findByText(/delete this assignment\?/i)).toBeInTheDocument();
    // No completed steps — the "erase that progress" warning doesn't apply.
    expect(screen.queryByText(/erase that progress/i)).not.toBeInTheDocument();
    expect(mockedAssignmentService.deleteAssignment).not.toHaveBeenCalled();
    expect(onBack).not.toHaveBeenCalled();

    await userEventInstance.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() =>
      expect(mockedAssignmentService.deleteAssignment).toHaveBeenCalledWith(
        "assignment-1",
      ),
    );
    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
  });

  it("cancelling the confirmation leaves the assignment untouched", async () => {
    mockedCourseService.listCourses.mockResolvedValue([]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
    const onBack = vi.fn();
    const userEventInstance = userEvent.setup();

    render(
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={onBack} onGoToPlan={vi.fn()} />,
    );
    await screen.findByRole("heading", { name: "Chapter 7 problem set" });

    await userEventInstance.click(screen.getByRole("button", { name: /delete assignment/i }));
    await screen.findByText(/delete this assignment\?/i);
    await userEventInstance.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(screen.queryByText(/delete this assignment\?/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Chapter 7 problem set" })).toBeInTheDocument();
    expect(mockedAssignmentService.deleteAssignment).not.toHaveBeenCalled();
    expect(onBack).not.toHaveBeenCalled();
  });

  it("warns that progress will be erased when a step is already complete", async () => {
    mockedCourseService.listCourses.mockResolvedValue([]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
    mockedWorkItemService.listWorkItems.mockResolvedValue([
      { id: "w1", assignmentId: "assignment-1", title: "Step 1", effortMinutes: 10, completedAt: "2026-03-01T00:00:00Z", position: 0 },
    ]);
    const onBack = vi.fn();
    const userEventInstance = userEvent.setup();

    render(
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={onBack} onGoToPlan={vi.fn()} />,
    );
    await screen.findByRole("heading", { name: "Chapter 7 problem set" });
    await screen.findByText("Step 1");

    await userEventInstance.click(screen.getByRole("button", { name: /delete assignment/i }));

    expect(await screen.findByText(/delete this assignment\?/i)).toBeInTheDocument();
    expect(screen.getByText(/erase that progress/i)).toBeInTheDocument();
    expect(mockedAssignmentService.deleteAssignment).not.toHaveBeenCalled();
    expect(onBack).not.toHaveBeenCalled();
  });

  it("shows steps as read-only checkboxes reflecting completion", async () => {
    mockedCourseService.listCourses.mockResolvedValue([]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
    mockedWorkItemService.listWorkItems.mockResolvedValue([
      { id: "w1", assignmentId: "assignment-1", title: "Step 1", effortMinutes: 10, completedAt: "2026-03-01T00:00:00Z", position: 0 },
      { id: "w2", assignmentId: "assignment-1", title: "Step 2", effortMinutes: 10, completedAt: null, position: 1 },
    ]);

    render(
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
    );
    await screen.findByRole("heading", { name: "Chapter 7 problem set" });

    const step1 = await screen.findByRole("checkbox", { name: /step 1 complete/i });
    const step2 = screen.getByRole("checkbox", { name: /step 2 not yet complete/i });
    expect(step1).toBeChecked();
    expect(step1).toBeDisabled();
    expect(step2).not.toBeChecked();
    expect(step2).toBeDisabled();
  });

  it("offers 'Break this down' and 'Just add a step' when there is no Work Breakdown yet, and neither once one exists (docs/features/assignment-detail-cta-hierarchy.md item 3b)", async () => {
    mockedCourseService.listCourses.mockResolvedValue([]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);

    const { unmount } = render(
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
    );
    await screen.findByRole("heading", { name: "Chapter 7 problem set" });
    expect(screen.getByRole("button", { name: /break this down/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /just add a step/i })).toBeInTheDocument();
    unmount();

    mockedWorkItemService.listWorkItems.mockResolvedValue([
      { id: "w1", assignmentId: "assignment-1", title: "Step 1", effortMinutes: 10, completedAt: null, position: 0 },
    ]);
    render(
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
    );
    await screen.findByRole("heading", { name: "Chapter 7 problem set" });
    expect(screen.queryByRole("button", { name: /break this down/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit breakdown/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add another step/i })).toBeInTheDocument();
  });

  it("opens the Work Breakdown flow, and cancelling returns to Detail unchanged", async () => {
    mockedCourseService.listCourses.mockResolvedValue([]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
    const userEventInstance = userEvent.setup();

    render(
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
    );
    await screen.findByRole("heading", { name: "Chapter 7 problem set" });

    await userEventInstance.click(screen.getByRole("button", { name: /break this down/i }));

    expect(screen.getByText(/what are the main pieces/i)).toBeInTheDocument();

    await userEventInstance.click(screen.getByRole("button", { name: /cancel/i }));

    expect(
      await screen.findByRole("heading", { name: "Chapter 7 problem set" }),
    ).toBeInTheDocument();
  });

  it("marks the assignment and all open steps complete, and prompts for reflection when a breakdown existed", async () => {
    mockedCourseService.listCourses.mockResolvedValue([]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
    mockedAssignmentService.completeAssignment.mockResolvedValue(undefined);
    mockedWorkItemService.listWorkItems.mockResolvedValue([
      { id: "w1", assignmentId: "assignment-1", title: "Step 1", effortMinutes: 10, completedAt: null, position: 0 },
    ]);
    mockedWorkItemService.completeAllForAssignment.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup();

    render(
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
    );
    await screen.findByRole("heading", { name: "Chapter 7 problem set" });

    await userEventInstance.click(
      screen.getByRole("button", { name: /mark assignment complete/i }),
    );

    await waitFor(() =>
      expect(mockedAssignmentService.completeAssignment).toHaveBeenCalledWith(
        "assignment-1",
      ),
    );
    expect(mockedWorkItemService.completeAllForAssignment).toHaveBeenCalledWith(
      "assignment-1",
    );
    expect(
      await screen.findByText(/did the way you broke this down work/i),
    ).toBeInTheDocument();
  });

  it("does not prompt for reflection when the assignment never had a Work Breakdown", async () => {
    mockedCourseService.listCourses.mockResolvedValue([]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
    mockedAssignmentService.completeAssignment.mockResolvedValue(undefined);
    mockedWorkItemService.listWorkItems.mockResolvedValue([]);
    mockedWorkItemService.completeAllForAssignment.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup();

    render(
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
    );
    await screen.findByRole("heading", { name: "Chapter 7 problem set" });

    await userEventInstance.click(
      screen.getByRole("button", { name: /mark assignment complete/i }),
    );

    await waitFor(() =>
      expect(mockedAssignmentService.completeAssignment).toHaveBeenCalledWith(
        "assignment-1",
      ),
    );
    expect(screen.queryByText(/did the way you broke this down work/i)).not.toBeInTheDocument();
    expect(await screen.findByText("Completed")).toBeInTheDocument();
  });

  describe("CTA hierarchy (docs/features/assignment-detail-cta-hierarchy.md)", () => {
    it("shows 'Plan work for today' as the dominant action, and 'Mark assignment complete' as a secondary one beneath it", async () => {
      mockedCourseService.listCourses.mockResolvedValue([]);
      mockedAssignmentService.getAssignment.mockResolvedValue(assignment);

      render(
        <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
      );
      await screen.findByRole("heading", { name: "Chapter 7 problem set" });

      const planButton = screen.getByRole("button", { name: /plan work for today/i });
      const completeButton = screen.getByRole("button", { name: /mark assignment complete/i });
      // The primary button carries the solid/filled treatment...
      expect(planButton.className).toMatch(/bg-primary/);
      // ...and the secondary one deliberately does not, matching the
      // prototype's own resolved hierarchy (ghost + muted text) rather
      // than reading as a second, competing primary action.
      expect(completeButton.className).not.toMatch(/bg-primary/);
      expect(completeButton.className).toMatch(/text-muted-foreground/);

      // "Plan work for today" precedes "Mark assignment complete" in
      // document order (both render after Steps).
      const position = planButton.compareDocumentPosition(completeButton);
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("calls onGoToPlan when 'Plan work for today' is tapped", async () => {
      mockedCourseService.listCourses.mockResolvedValue([]);
      mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
      const onGoToPlan = vi.fn();
      const userEventInstance = userEvent.setup();

      render(
        <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={onGoToPlan} />,
      );
      await screen.findByRole("heading", { name: "Chapter 7 problem set" });

      await userEventInstance.click(screen.getByRole("button", { name: /plan work for today/i }));
      expect(onGoToPlan).toHaveBeenCalledTimes(1);
    });
  });

  describe("Risk Detection message (docs/features/assignment-detail-cta-hierarchy.md item 2)", () => {
    const dueSoonAssignment = { ...assignment, dueDate: "2026-03-17" };

    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.setSystemTime(new Date(2026, 2, 16, 9, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows the same message Home would show, when the assignment qualifies", async () => {
      mockedCourseService.listCourses.mockResolvedValue([]);
      mockedAssignmentService.getAssignment.mockResolvedValue(dueSoonAssignment);
      mockedWorkItemService.listWorkItems.mockResolvedValue([
        { id: "w1", assignmentId: "assignment-1", title: "Step 1", effortMinutes: 15, completedAt: null, position: 0 },
      ]);

      render(
        <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
      );

      expect(
        await screen.findByText(/due soon and nothing planned for it yet/i),
      ).toBeInTheDocument();
    });

    it("shows nothing when the assignment doesn't qualify", async () => {
      mockedCourseService.listCourses.mockResolvedValue([]);
      // Default fixture's due date (2026-03-15) has already passed
      // relative to the fake "today" (2026-03-16) — never qualifies.
      mockedAssignmentService.getAssignment.mockResolvedValue(assignment);

      render(
        <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
      );
      await screen.findByRole("heading", { name: "Chapter 7 problem set" });

      expect(
        screen.queryByText(/nothing planned for it yet|worth replanning together/i),
      ).not.toBeInTheDocument();
    });

    it("never includes a minutes/percentage figure in the message (Domain Invariant 11)", async () => {
      mockedCourseService.listCourses.mockResolvedValue([]);
      mockedAssignmentService.getAssignment.mockResolvedValue(dueSoonAssignment);
      mockedWorkItemService.listWorkItems.mockResolvedValue([
        { id: "w1", assignmentId: "assignment-1", title: "Step 1", effortMinutes: 15, completedAt: null, position: 0 },
      ]);

      render(
        <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
      );

      const message = await screen.findByText(/due soon and nothing planned for it yet/i);
      expect(message.textContent).not.toMatch(/\d/);
    });

    it("fails closed rather than open — shows nothing if Activities fails to load, even though the assignment would otherwise qualify", async () => {
      mockedCourseService.listCourses.mockResolvedValue([]);
      mockedAssignmentService.getAssignment.mockResolvedValue(dueSoonAssignment);
      mockedWorkItemService.listWorkItems.mockResolvedValue([
        { id: "w1", assignmentId: "assignment-1", title: "Step 1", effortMinutes: 15, completedAt: null, position: 0 },
      ]);
      mockedActivityService.listActivities.mockRejectedValue({ message: "network error" });

      render(
        <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
      );
      await screen.findByRole("heading", { name: "Chapter 7 problem set" });
      // Give the rejected Activities fetch a tick to settle.
      await vi.waitFor(() => {});

      expect(
        screen.queryByText(/due soon and nothing planned for it yet/i),
      ).not.toBeInTheDocument();
      // The rest of the page is unaffected by that failure.
      expect(screen.getByRole("heading", { name: "Chapter 7 problem set" })).toBeInTheDocument();
    });

    it("fails closed rather than open — shows nothing if Preferences fails to load", async () => {
      mockedCourseService.listCourses.mockResolvedValue([]);
      mockedAssignmentService.getAssignment.mockResolvedValue(dueSoonAssignment);
      mockedWorkItemService.listWorkItems.mockResolvedValue([
        { id: "w1", assignmentId: "assignment-1", title: "Step 1", effortMinutes: 15, completedAt: null, position: 0 },
      ]);
      mockedPreferencesService.getPreferences.mockRejectedValue({ message: "network error" });

      render(
        <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
      );
      await screen.findByRole("heading", { name: "Chapter 7 problem set" });
      await vi.waitFor(() => {});

      expect(
        screen.queryByText(/due soon and nothing planned for it yet/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Breakdown nudge (docs/features/assignment-detail-cta-hierarchy.md item 3)", () => {
    it("shows the nudge for a large assignment with no Work Items yet", async () => {
      mockedCourseService.listCourses.mockResolvedValue([]);
      mockedAssignmentService.getAssignment.mockResolvedValue({
        ...assignment,
        effortMinutes: 60,
      });

      render(
        <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
      );

      expect(
        await screen.findByText(/would it help to break it into smaller steps/i),
      ).toBeInTheDocument();
    });

    it("does not show the nudge once at least one Work Item exists", async () => {
      mockedCourseService.listCourses.mockResolvedValue([]);
      mockedAssignmentService.getAssignment.mockResolvedValue({
        ...assignment,
        effortMinutes: 60,
      });
      mockedWorkItemService.listWorkItems.mockResolvedValue([
        { id: "w1", assignmentId: "assignment-1", title: "Step 1", effortMinutes: 20, completedAt: null, position: 0 },
      ]);

      render(
        <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
      );
      await screen.findByRole("heading", { name: "Chapter 7 problem set" });

      expect(
        screen.queryByText(/would it help to break it into smaller steps/i),
      ).not.toBeInTheDocument();
    });

    it("does not show the nudge for a small estimate, regardless of Work Item count", async () => {
      mockedCourseService.listCourses.mockResolvedValue([]);
      mockedAssignmentService.getAssignment.mockResolvedValue(assignment); // 30m
      mockedWorkItemService.listWorkItems.mockResolvedValue([]);

      render(
        <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
      );
      await screen.findByRole("heading", { name: "Chapter 7 problem set" });

      expect(
        screen.queryByText(/would it help to break it into smaller steps/i),
      ).not.toBeInTheDocument();
    });

    it("'Yes, help me start' opens the same Work Breakdown flow as the Steps section's own button", async () => {
      mockedCourseService.listCourses.mockResolvedValue([]);
      mockedAssignmentService.getAssignment.mockResolvedValue({
        ...assignment,
        effortMinutes: 60,
      });
      const userEventInstance = userEvent.setup();

      render(
        <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
      );
      await screen.findByText(/would it help to break it into smaller steps/i);

      await userEventInstance.click(screen.getByRole("button", { name: /yes, help me start/i }));

      expect(screen.getByText(/what are the main pieces/i)).toBeInTheDocument();
    });
  });

  describe("Inline step management (docs/features/assignment-detail-cta-hierarchy.md item 3b)", () => {
    it("adds a step via 'Just add a step' without ever opening WorkBreakdownPage, and updates the assignment's total effort", async () => {
      mockedCourseService.listCourses.mockResolvedValue([]);
      mockedAssignmentService.getAssignment.mockResolvedValue(assignment); // effortMinutes: 30
      mockedAssignmentService.updateAssignment.mockResolvedValue(undefined);
      mockedWorkItemService.createWorkItems.mockResolvedValue([
        { id: "w1", assignmentId: "assignment-1", title: "Draft outline", effortMinutes: 60, completedAt: null, position: 0 },
      ]);
      mockedDecompositionAttemptService.recordDecompositionAttempt.mockResolvedValue(undefined);
      const userEventInstance = userEvent.setup();

      render(
        <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
      );
      await screen.findByRole("heading", { name: "Chapter 7 problem set" });

      await userEventInstance.click(screen.getByRole("button", { name: /just add a step/i }));
      await userEventInstance.type(
        screen.getByRole("textbox", { name: /new step title/i }),
        "Draft outline",
      );
      await userEventInstance.click(screen.getByRole("button", { name: "1h" }));
      await userEventInstance.click(screen.getByRole("button", { name: /^add$/i }));

      await waitFor(() =>
        expect(mockedWorkItemService.createWorkItems).toHaveBeenCalledWith("student-1", [
          { assignmentId: "assignment-1", title: "Draft outline", effortMinutes: 60, position: 0 },
        ]),
      );
      // Never opened the multi-step wizard.
      expect(screen.queryByText(/what are the main pieces/i)).not.toBeInTheDocument();
      expect(await screen.findByText("Draft outline")).toBeInTheDocument();
      await waitFor(() =>
        expect(mockedAssignmentService.updateAssignment).toHaveBeenCalledWith("assignment-1", {
          title: "Chapter 7 problem set",
          dueDate: "2026-03-15",
          effortMinutes: 60,
          notes: "Bring a calculator",
        }),
      );
      expect(mockedDecompositionAttemptService.recordDecompositionAttempt).toHaveBeenCalledWith(
        "student-1",
        {
          assignmentId: "assignment-1",
          initialWorkItems: [],
          resultingWorkItems: ["Draft outline"],
          revisionCount: 1,
          outcome: "confirmed",
        },
      );
    });

    it("edits an incomplete step inline, without navigating away", async () => {
      mockedCourseService.listCourses.mockResolvedValue([]);
      mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
      mockedAssignmentService.updateAssignment.mockResolvedValue(undefined);
      mockedWorkItemService.listWorkItems.mockResolvedValue([
        { id: "w1", assignmentId: "assignment-1", title: "Step 1", effortMinutes: 10, completedAt: null, position: 0 },
      ]);
      mockedWorkItemService.updateWorkItem.mockResolvedValue(undefined);
      mockedDecompositionAttemptService.recordDecompositionAttempt.mockResolvedValue(undefined);
      const userEventInstance = userEvent.setup();

      render(
        <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
      );
      await screen.findByText("Step 1");

      await userEventInstance.click(screen.getByRole("button", { name: /edit step 1/i }));
      const titleInput = screen.getByRole("textbox", { name: /edit step 1/i });
      await userEventInstance.clear(titleInput);
      await userEventInstance.type(titleInput, "Step 1 revised");
      await userEventInstance.click(screen.getByRole("button", { name: "45m" }));
      await userEventInstance.click(screen.getByRole("button", { name: /^save$/i }));

      await waitFor(() =>
        expect(mockedWorkItemService.updateWorkItem).toHaveBeenCalledWith("w1", {
          title: "Step 1 revised",
          effortMinutes: 45,
        }),
      );
      expect(await screen.findByText("Step 1 revised")).toBeInTheDocument();
      await waitFor(() =>
        expect(mockedAssignmentService.updateAssignment).toHaveBeenCalledWith("assignment-1", {
          title: "Chapter 7 problem set",
          dueDate: "2026-03-15",
          effortMinutes: 45,
          notes: "Bring a calculator",
        }),
      );
      expect(mockedDecompositionAttemptService.recordDecompositionAttempt).toHaveBeenCalledWith(
        "student-1",
        {
          assignmentId: "assignment-1",
          initialWorkItems: ["Step 1"],
          resultingWorkItems: ["Step 1 revised"],
          revisionCount: 1,
          outcome: "confirmed",
        },
      );
    });

    it("never offers inline editing for a completed step", async () => {
      mockedCourseService.listCourses.mockResolvedValue([]);
      mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
      mockedWorkItemService.listWorkItems.mockResolvedValue([
        { id: "w1", assignmentId: "assignment-1", title: "Step 1", effortMinutes: 10, completedAt: "2026-03-01T00:00:00Z", position: 0 },
      ]);

      render(
        <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
      );
      await screen.findByText("Step 1");

      expect(screen.queryByRole("button", { name: /edit step 1/i })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /delete step 1/i })).toBeInTheDocument();
    });

    it("deletes an incomplete step immediately, with no confirmation, and updates the total effort", async () => {
      mockedCourseService.listCourses.mockResolvedValue([]);
      mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
      mockedAssignmentService.updateAssignment.mockResolvedValue(undefined);
      mockedWorkItemService.listWorkItems.mockResolvedValue([
        { id: "w1", assignmentId: "assignment-1", title: "Step 1", effortMinutes: 10, completedAt: null, position: 0 },
      ]);
      mockedWorkItemService.deleteWorkItems.mockResolvedValue(undefined);
      const userEventInstance = userEvent.setup();

      render(
        <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
      );
      await screen.findByText("Step 1");

      await userEventInstance.click(screen.getByRole("button", { name: /delete step 1/i }));

      expect(screen.queryByText(/delete this assignment/i)).not.toBeInTheDocument();
      await waitFor(() => expect(mockedWorkItemService.deleteWorkItems).toHaveBeenCalledWith(["w1"]));
      expect(screen.queryByText("Step 1")).not.toBeInTheDocument();
      await waitFor(() =>
        expect(mockedAssignmentService.updateAssignment).toHaveBeenCalledWith("assignment-1", {
          title: "Chapter 7 problem set",
          dueDate: "2026-03-15",
          effortMinutes: 0,
          notes: "Bring a calculator",
        }),
      );
      // Deleting doesn't record a DecompositionAttempt — only add/edit do.
      expect(mockedDecompositionAttemptService.recordDecompositionAttempt).not.toHaveBeenCalled();
    });

    it("asks for confirmation before deleting a completed step, and cancelling leaves it untouched", async () => {
      mockedCourseService.listCourses.mockResolvedValue([]);
      mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
      mockedWorkItemService.listWorkItems.mockResolvedValue([
        { id: "w1", assignmentId: "assignment-1", title: "Step 1", effortMinutes: 10, completedAt: "2026-03-01T00:00:00Z", position: 0 },
      ]);
      const userEventInstance = userEvent.setup();

      render(
        <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
      );
      await screen.findByText("Step 1");

      await userEventInstance.click(screen.getByRole("button", { name: /delete step 1/i }));

      expect(await screen.findByText(/already complete.*erase that progress/i)).toBeInTheDocument();
      expect(mockedWorkItemService.deleteWorkItems).not.toHaveBeenCalled();

      await userEventInstance.click(screen.getByRole("button", { name: /^cancel$/i }));

      expect(screen.queryByText(/erase that progress/i)).not.toBeInTheDocument();
      expect(screen.getByText("Step 1")).toBeInTheDocument();
      expect(mockedWorkItemService.deleteWorkItems).not.toHaveBeenCalled();
    });

    it("deletes a completed step once confirmed", async () => {
      mockedCourseService.listCourses.mockResolvedValue([]);
      mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
      mockedAssignmentService.updateAssignment.mockResolvedValue(undefined);
      mockedWorkItemService.listWorkItems.mockResolvedValue([
        { id: "w1", assignmentId: "assignment-1", title: "Step 1", effortMinutes: 10, completedAt: "2026-03-01T00:00:00Z", position: 0 },
      ]);
      mockedWorkItemService.deleteWorkItems.mockResolvedValue(undefined);
      const userEventInstance = userEvent.setup();

      render(
        <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} onGoToPlan={vi.fn()} />,
      );
      await screen.findByText("Step 1");

      await userEventInstance.click(screen.getByRole("button", { name: /delete step 1/i }));
      await screen.findByText(/erase that progress/i);
      await userEventInstance.click(screen.getByRole("button", { name: /^delete$/i }));

      await waitFor(() => expect(mockedWorkItemService.deleteWorkItems).toHaveBeenCalledWith(["w1"]));
      expect(screen.queryByText("Step 1")).not.toBeInTheDocument();
    });
  });
});
