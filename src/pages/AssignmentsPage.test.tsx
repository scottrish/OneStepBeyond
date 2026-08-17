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
}));

vi.mock("../services/workItemService", () => ({
  listWorkItemsForStudent: vi.fn(),
  createWorkItems: vi.fn(),
  deleteWorkItems: vi.fn(),
  completeAllForAssignment: vi.fn(),
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
};
const mockedWorkItemService = workItemService as unknown as {
  listWorkItemsForStudent: ReturnType<typeof vi.fn>;
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

// Assignment Detail is a global overlay owned by App.tsx now (see
// docs/decisions/20260817-assignment-detail-global-overlay.md) — this
// page just requests it open. Round-trip behavior (opening Detail) is
// covered by App.test.tsx instead.
function renderAssignmentsPage(overrides: Record<string, unknown> = {}) {
  return render(
    <AssignmentsPage
      user={user}
      onGoToHome={vi.fn()}
      onOpenAssignment={vi.fn()}
      {...overrides}
    />,
  );
}

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

    renderAssignmentsPage({ onGoToHome });

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

    renderAssignmentsPage();

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

    renderAssignmentsPage();

    expect(
      await screen.findByText(/about 15m left of 30m planned/i),
    ).toBeInTheDocument();
  });

  it("requests Assignment Detail open when a card is tapped", async () => {
    mockedCourseService.listCourses.mockResolvedValue([course]);
    mockedAssignmentService.listAssignments.mockResolvedValue([openAssignment]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([]);
    const onOpenAssignment = vi.fn();
    const userEventInstance = userEvent.setup();

    renderAssignmentsPage({ onOpenAssignment });
    const title = await screen.findByText("Chapter 7 problem set");
    await userEventInstance.click(title.closest("button")!);

    expect(onOpenAssignment).toHaveBeenCalledWith("a1");
  });

  it("requests Assignment Detail open when a Finished card is tapped", async () => {
    mockedCourseService.listCourses.mockResolvedValue([course]);
    mockedAssignmentService.listAssignments.mockResolvedValue([doneAssignment]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([]);
    const onOpenAssignment = vi.fn();
    const userEventInstance = userEvent.setup();

    renderAssignmentsPage({ onOpenAssignment });
    await userEventInstance.click(await screen.findByRole("button", { name: "Reading response" }));

    expect(onOpenAssignment).toHaveBeenCalledWith("a2");
  });

  it("shows step progress and a progress bar when the assignment has more than one work item", async () => {
    mockedCourseService.listCourses.mockResolvedValue([course]);
    mockedAssignmentService.listAssignments.mockResolvedValue([openAssignment]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([
      { id: "w1", assignmentId: "a1", title: "Step 1", effortMinutes: 10, completedAt: "2026-03-01T00:00:00Z" },
      { id: "w2", assignmentId: "a1", title: "Step 2", effortMinutes: 10, completedAt: null },
    ]);

    renderAssignmentsPage();

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

    renderAssignmentsPage();

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

    renderAssignmentsPage();
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

  it("requires confirmation before deleting, even with no completed steps, and deletes only once confirmed", async () => {
    mockedCourseService.listCourses.mockResolvedValue([course]);
    mockedAssignmentService.listAssignments.mockResolvedValue([openAssignment]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([]);
    mockedAssignmentService.deleteAssignment.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup();

    renderAssignmentsPage();
    await screen.findByText("Chapter 7 problem set");

    await userEventInstance.click(
      screen.getByRole("button", { name: /delete chapter 7 problem set/i }),
    );

    expect(await screen.findByText(/delete this assignment\?/i)).toBeInTheDocument();
    // No completed steps — the "erase that progress" warning doesn't apply.
    expect(screen.queryByText(/erase that progress/i)).not.toBeInTheDocument();
    expect(mockedAssignmentService.deleteAssignment).not.toHaveBeenCalled();

    await userEventInstance.click(screen.getByRole("button", { name: /^delete$/i }));
    await waitFor(() =>
      expect(mockedAssignmentService.deleteAssignment).toHaveBeenCalledWith("a1"),
    );
    expect(screen.queryByText("Chapter 7 problem set")).not.toBeInTheDocument();
  });

  it("cancelling the confirmation leaves the assignment in the list", async () => {
    mockedCourseService.listCourses.mockResolvedValue([course]);
    mockedAssignmentService.listAssignments.mockResolvedValue([openAssignment]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([]);
    const userEventInstance = userEvent.setup();

    renderAssignmentsPage();
    await screen.findByText("Chapter 7 problem set");

    await userEventInstance.click(
      screen.getByRole("button", { name: /delete chapter 7 problem set/i }),
    );
    await screen.findByText(/delete this assignment\?/i);
    await userEventInstance.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(screen.queryByText(/delete this assignment\?/i)).not.toBeInTheDocument();
    expect(screen.getByText("Chapter 7 problem set")).toBeInTheDocument();
    expect(mockedAssignmentService.deleteAssignment).not.toHaveBeenCalled();
  });

  it("warns that progress will be erased when a step is already complete", async () => {
    mockedCourseService.listCourses.mockResolvedValue([course]);
    mockedAssignmentService.listAssignments.mockResolvedValue([openAssignment]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([
      { id: "w1", assignmentId: "a1", title: "Step 1", effortMinutes: 10, completedAt: "2026-03-01T00:00:00Z" },
    ]);
    const userEventInstance = userEvent.setup();

    renderAssignmentsPage();
    await screen.findByText("Chapter 7 problem set");

    await userEventInstance.click(
      screen.getByRole("button", { name: /delete chapter 7 problem set/i }),
    );

    expect(
      await screen.findByText(/delete this assignment\?/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/erase that progress/i)).toBeInTheDocument();
    expect(mockedAssignmentService.deleteAssignment).not.toHaveBeenCalled();

    await userEventInstance.click(screen.getByRole("button", { name: /^delete$/i }));
    await waitFor(() =>
      expect(mockedAssignmentService.deleteAssignment).toHaveBeenCalledWith("a1"),
    );
  });
});
