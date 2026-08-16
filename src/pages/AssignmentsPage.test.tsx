import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "@supabase/supabase-js";

vi.mock("../services/courseService", () => ({
  listCourses: vi.fn(),
  createCourse: vi.fn(),
  renameCourse: vi.fn(),
}));

vi.mock("../services/assignmentService", () => ({
  listAssignments: vi.fn(),
  updateAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
  // getAssignment/completeAssignment are only reached once a card is
  // opened into AssignmentDetailPage (see the "opens the detail screen"
  // test below) — mocked here since AssignmentsPage now renders that
  // component directly rather than only linking to it.
  getAssignment: vi.fn(),
  completeAssignment: vi.fn(),
}));

vi.mock("../services/workItemService", () => ({
  listWorkItemsForStudent: vi.fn(),
  listWorkItems: vi.fn(),
  createWorkItems: vi.fn(),
  deleteWorkItems: vi.fn(),
  completeAllForAssignment: vi.fn(),
}));

// Reached transitively once a card is opened into AssignmentDetailPage,
// which can now route into the Work Breakdown / Reflection flows — not
// exercised by this file's own tests, but their real implementations
// import ../lib/supabase (which throws without env vars), so they must
// be mocked here regardless.
vi.mock("../services/decompositionAttemptService", () => ({
  recordDecompositionAttempt: vi.fn(),
}));
vi.mock("../services/reflectionService", () => ({
  recordReflection: vi.fn(),
}));

import * as courseService from "../services/courseService";
import * as assignmentService from "../services/assignmentService";
import * as workItemService from "../services/workItemService";
import AssignmentsPage from "./AssignmentsPage";

const mockedCourseService = courseService as unknown as {
  listCourses: ReturnType<typeof vi.fn>;
};
const mockedAssignmentService = assignmentService as unknown as {
  listAssignments: ReturnType<typeof vi.fn>;
  updateAssignment: ReturnType<typeof vi.fn>;
  deleteAssignment: ReturnType<typeof vi.fn>;
  getAssignment: ReturnType<typeof vi.fn>;
  completeAssignment: ReturnType<typeof vi.fn>;
};
const mockedWorkItemService = workItemService as unknown as {
  listWorkItemsForStudent: ReturnType<typeof vi.fn>;
  listWorkItems: ReturnType<typeof vi.fn>;
  createWorkItems: ReturnType<typeof vi.fn>;
  deleteWorkItems: ReturnType<typeof vi.fn>;
  completeAllForAssignment: ReturnType<typeof vi.fn>;
};

const user = { id: "student-1", email: "person@example.com" } as User;

const course = { id: "course-1", name: "Biology", colorIndex: 0 };

const openAssignment = {
  id: "a1",
  courseId: "course-1",
  title: "Chapter 7 problem set",
  dueDate: "2026-03-15",
  effortMinutes: 30,
  notes: null,
  completedAt: null,
};

const doneAssignment = {
  id: "a2",
  courseId: "course-1",
  title: "Reading response",
  dueDate: "2026-03-01",
  effortMinutes: 20,
  notes: null,
  completedAt: "2026-03-01T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AssignmentsPage", () => {
  it("shows the empty state with a way back to Home when there are no assignments", async () => {
    mockedCourseService.listCourses.mockResolvedValue([]);
    mockedAssignmentService.listAssignments.mockResolvedValue([]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([]);
    const onGoToHome = vi.fn();
    const userEventInstance = userEvent.setup();

    render(<AssignmentsPage user={user} onGoToHome={onGoToHome} />);

    expect(await screen.findByText(/no assignments yet/i)).toBeInTheDocument();

    await userEventInstance.click(
      screen.getByRole("button", { name: /go to home/i }),
    );
    expect(onGoToHome).toHaveBeenCalledTimes(1);
  });

  it("lists open assignments with remaining-effort text and no progress bar when unstructured", async () => {
    mockedCourseService.listCourses.mockResolvedValue([course]);
    mockedAssignmentService.listAssignments.mockResolvedValue([openAssignment]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([]);

    render(<AssignmentsPage user={user} onGoToHome={vi.fn()} />);

    expect(await screen.findByText("Chapter 7 problem set")).toBeInTheDocument();
    expect(screen.getByText(/about 30m left/i)).toBeInTheDocument();
    expect(document.querySelector(".bg-primary.h-full")).not.toBeInTheDocument();
  });

  it("shows the assignment's original estimate alongside a single step's remaining time", async () => {
    mockedCourseService.listCourses.mockResolvedValue([course]);
    mockedAssignmentService.listAssignments.mockResolvedValue([openAssignment]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([
      { id: "w1", assignmentId: "a1", title: "Step 1", effortMinutes: 15, completedAt: null },
    ]);

    render(<AssignmentsPage user={user} onGoToHome={vi.fn()} />);

    expect(
      await screen.findByText(/about 15m left of 30m planned/i),
    ).toBeInTheDocument();
  });

  it("opens the detail screen when a card is tapped, and back returns to the list", async () => {
    mockedCourseService.listCourses.mockResolvedValue([course]);
    mockedAssignmentService.listAssignments.mockResolvedValue([openAssignment]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([]);
    mockedAssignmentService.getAssignment.mockResolvedValue(openAssignment);
    mockedWorkItemService.listWorkItems.mockResolvedValue([]);
    const userEventInstance = userEvent.setup();

    render(<AssignmentsPage user={user} onGoToHome={vi.fn()} />);
    const title = await screen.findByText("Chapter 7 problem set");
    await userEventInstance.click(title.closest("button")!);

    expect(
      await screen.findByRole("heading", { name: "Chapter 7 problem set" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^steps$/i })).toBeInTheDocument();

    await userEventInstance.click(screen.getByRole("button", { name: /back/i }));
    expect(await screen.findByRole("heading", { name: /^assignments$/i })).toBeInTheDocument();
  });

  it("deleting from Detail with no completed steps returns to the list with an Undo affordance, deferring the real delete", async () => {
    mockedCourseService.listCourses.mockResolvedValue([course]);
    mockedAssignmentService.listAssignments.mockResolvedValue([openAssignment]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([]);
    mockedAssignmentService.getAssignment.mockResolvedValue(openAssignment);
    mockedWorkItemService.listWorkItems.mockResolvedValue([]);
    mockedAssignmentService.deleteAssignment.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup();

    render(<AssignmentsPage user={user} onGoToHome={vi.fn()} />);
    const title = await screen.findByText("Chapter 7 problem set");
    await userEventInstance.click(title.closest("button")!);
    await screen.findByRole("heading", { name: "Chapter 7 problem set" });

    await userEventInstance.click(screen.getByRole("button", { name: /delete assignment/i }));

    expect(await screen.findByRole("heading", { name: /^assignments$/i })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/chapter 7 problem set.*deleted/i);
    expect(mockedAssignmentService.deleteAssignment).not.toHaveBeenCalled();
  });

  it("shows step progress and a progress bar when the assignment has more than one work item", async () => {
    mockedCourseService.listCourses.mockResolvedValue([course]);
    mockedAssignmentService.listAssignments.mockResolvedValue([openAssignment]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([
      { id: "w1", assignmentId: "a1", title: "Step 1", effortMinutes: 10, completedAt: "2026-03-01T00:00:00Z" },
      { id: "w2", assignmentId: "a1", title: "Step 2", effortMinutes: 10, completedAt: null },
    ]);

    render(<AssignmentsPage user={user} onGoToHome={vi.fn()} />);

    expect(
      await screen.findByText(/1 of 2 steps complete/i),
    ).toBeInTheDocument();
  });

  it("shows completed assignments in a separate Finished section", async () => {
    mockedCourseService.listCourses.mockResolvedValue([course]);
    mockedAssignmentService.listAssignments.mockResolvedValue([
      openAssignment,
      doneAssignment,
    ]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([]);

    render(<AssignmentsPage user={user} onGoToHome={vi.fn()} />);

    await screen.findByText("Chapter 7 problem set");
    expect(screen.getByRole("heading", { name: /finished/i })).toBeInTheDocument();
    expect(screen.getByText("Reading response")).toHaveClass("line-through");
  });

  it("edits an assignment inline", async () => {
    mockedCourseService.listCourses.mockResolvedValue([course]);
    mockedAssignmentService.listAssignments.mockResolvedValue([openAssignment]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([]);
    mockedAssignmentService.updateAssignment.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup();

    render(<AssignmentsPage user={user} onGoToHome={vi.fn()} />);
    await screen.findByText("Chapter 7 problem set");

    await userEventInstance.click(
      screen.getByRole("button", { name: /edit chapter 7 problem set/i }),
    );
    const titleInput = screen.getByLabelText(/what is it\?/i);
    await userEventInstance.clear(titleInput);
    await userEventInstance.type(titleInput, "Chapter 8 problem set");
    await userEventInstance.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(mockedAssignmentService.updateAssignment).toHaveBeenCalledWith(
        "a1",
        expect.objectContaining({ title: "Chapter 8 problem set" }),
      ),
    );
    expect(await screen.findByText("Chapter 8 problem set")).toBeInTheDocument();
  });

  it("deleting an assignment with no completed steps hides it immediately and offers Undo, without calling delete yet", async () => {
    mockedCourseService.listCourses.mockResolvedValue([course]);
    mockedAssignmentService.listAssignments.mockResolvedValue([openAssignment]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([]);
    mockedAssignmentService.deleteAssignment.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup();

    render(<AssignmentsPage user={user} onGoToHome={vi.fn()} />);
    await screen.findByText("Chapter 7 problem set");

    await userEventInstance.click(
      screen.getByRole("button", { name: /delete chapter 7 problem set/i }),
    );

    expect(screen.queryByText("Chapter 7 problem set")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/chapter 7 problem set.*deleted/i);
    expect(screen.queryByText(/delete this assignment\?/i)).not.toBeInTheDocument();
    expect(mockedAssignmentService.deleteAssignment).not.toHaveBeenCalled();
  });

  it("commits the delete once the Undo window elapses", async () => {
    mockedCourseService.listCourses.mockResolvedValue([course]);
    mockedAssignmentService.listAssignments.mockResolvedValue([openAssignment]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([]);
    mockedAssignmentService.deleteAssignment.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup();
    // Spy on the real setTimeout rather than replacing the whole timer
    // subsystem (vi.useFakeTimers) — this avoids interfering with
    // user-event's and React's own internal scheduling.
    const setTimeoutSpy = vi.spyOn(window, "setTimeout");

    render(<AssignmentsPage user={user} onGoToHome={vi.fn()} />);
    await screen.findByText("Chapter 7 problem set");

    await userEventInstance.click(
      screen.getByRole("button", { name: /delete chapter 7 problem set/i }),
    );
    expect(mockedAssignmentService.deleteAssignment).not.toHaveBeenCalled();

    const undoTimerCall = setTimeoutSpy.mock.calls.find(([, ms]) => ms === 5000);
    (undoTimerCall![0] as () => void)();

    await waitFor(() =>
      expect(mockedAssignmentService.deleteAssignment).toHaveBeenCalledWith("a1"),
    );
    setTimeoutSpy.mockRestore();
  });

  it("Undo restores the assignment and never calls delete", async () => {
    mockedCourseService.listCourses.mockResolvedValue([course]);
    mockedAssignmentService.listAssignments.mockResolvedValue([openAssignment]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([]);
    const userEventInstance = userEvent.setup();
    const setTimeoutSpy = vi.spyOn(window, "setTimeout");
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");

    render(<AssignmentsPage user={user} onGoToHome={vi.fn()} />);
    await screen.findByText("Chapter 7 problem set");

    await userEventInstance.click(
      screen.getByRole("button", { name: /delete chapter 7 problem set/i }),
    );
    await userEventInstance.click(screen.getByRole("button", { name: /^undo$/i }));

    expect(screen.getByText("Chapter 7 problem set")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    const undoTimerIndex = setTimeoutSpy.mock.calls.findIndex(([, ms]) => ms === 5000);
    expect(clearTimeoutSpy).toHaveBeenCalledWith(
      setTimeoutSpy.mock.results[undoTimerIndex].value,
    );
    expect(mockedAssignmentService.deleteAssignment).not.toHaveBeenCalled();
    setTimeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });

  it("requires confirmation to delete an assignment with completed steps", async () => {
    mockedCourseService.listCourses.mockResolvedValue([course]);
    mockedAssignmentService.listAssignments.mockResolvedValue([openAssignment]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([
      { id: "w1", assignmentId: "a1", title: "Step 1", effortMinutes: 10, completedAt: "2026-03-01T00:00:00Z" },
    ]);
    const userEventInstance = userEvent.setup();

    render(<AssignmentsPage user={user} onGoToHome={vi.fn()} />);
    await screen.findByText("Chapter 7 problem set");

    await userEventInstance.click(
      screen.getByRole("button", { name: /delete chapter 7 problem set/i }),
    );

    expect(
      await screen.findByText(/delete this assignment\?/i),
    ).toBeInTheDocument();
    expect(mockedAssignmentService.deleteAssignment).not.toHaveBeenCalled();

    await userEventInstance.click(screen.getByRole("button", { name: /^delete$/i }));
    await waitFor(() =>
      expect(mockedAssignmentService.deleteAssignment).toHaveBeenCalledWith("a1"),
    );
  });
});
