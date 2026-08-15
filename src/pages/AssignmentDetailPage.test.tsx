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
  createAssignment: vi.fn(),
  getAssignment: vi.fn(),
  updateAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
  completeAssignment: vi.fn(),
}));

vi.mock("../services/workItemService", () => ({
  listWorkItems: vi.fn(),
  createWorkItem: vi.fn(),
  completeAllForAssignment: vi.fn(),
}));

import * as courseService from "../services/courseService";
import * as assignmentService from "../services/assignmentService";
import * as workItemService from "../services/workItemService";
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
  createWorkItem: ReturnType<typeof vi.fn>;
  completeAllForAssignment: ReturnType<typeof vi.fn>;
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

beforeEach(() => {
  vi.clearAllMocks();
  mockedWorkItemService.listWorkItems.mockResolvedValue([]);
});

describe("AssignmentDetailPage", () => {
  it("shows the assignment's course, title, due date, remaining time, and notes", async () => {
    mockedCourseService.listCourses.mockResolvedValue([
      { id: "course-1", name: "Biology", colorIndex: 0 },
    ]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);

    render(
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} />,
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
      { id: "w1", assignmentId: "assignment-1", title: "Step 1", effortMinutes: 15, completedAt: null },
    ]);

    render(
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} />,
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
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} />,
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
      <AssignmentDetailPage user={user} assignmentId="missing" onBack={vi.fn()} />,
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
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={onBack} />,
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
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} />,
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

  it("deletes immediately and navigates back when there are no completed steps", async () => {
    mockedCourseService.listCourses.mockResolvedValue([]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
    mockedAssignmentService.deleteAssignment.mockResolvedValue(undefined);
    const onBack = vi.fn();
    const userEventInstance = userEvent.setup();

    render(
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={onBack} />,
    );
    await screen.findByRole("heading", { name: "Chapter 7 problem set" });

    await userEventInstance.click(screen.getByRole("button", { name: /delete assignment/i }));

    await waitFor(() =>
      expect(mockedAssignmentService.deleteAssignment).toHaveBeenCalledWith(
        "assignment-1",
      ),
    );
    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
  });

  it("defers the delete to onDeleteImmediate when provided, instead of deleting directly", async () => {
    mockedCourseService.listCourses.mockResolvedValue([]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
    const onBack = vi.fn();
    const onDeleteImmediate = vi.fn();
    const userEventInstance = userEvent.setup();

    render(
      <AssignmentDetailPage
        user={user}
        assignmentId="assignment-1"
        onBack={onBack}
        onDeleteImmediate={onDeleteImmediate}
      />,
    );
    await screen.findByRole("heading", { name: "Chapter 7 problem set" });

    await userEventInstance.click(screen.getByRole("button", { name: /delete assignment/i }));

    expect(onDeleteImmediate).toHaveBeenCalledWith(assignment);
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(mockedAssignmentService.deleteAssignment).not.toHaveBeenCalled();
  });

  it("requires confirmation to delete when a step is already complete", async () => {
    mockedCourseService.listCourses.mockResolvedValue([]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
    mockedWorkItemService.listWorkItems.mockResolvedValue([
      { id: "w1", assignmentId: "assignment-1", title: "Step 1", effortMinutes: 10, completedAt: "2026-03-01T00:00:00Z" },
    ]);
    const onBack = vi.fn();
    const userEventInstance = userEvent.setup();

    render(
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={onBack} />,
    );
    await screen.findByRole("heading", { name: "Chapter 7 problem set" });
    await screen.findByText("Step 1");

    await userEventInstance.click(screen.getByRole("button", { name: /delete assignment/i }));

    expect(await screen.findByText(/delete this assignment\?/i)).toBeInTheDocument();
    expect(mockedAssignmentService.deleteAssignment).not.toHaveBeenCalled();
    expect(onBack).not.toHaveBeenCalled();
  });

  it("adds a step", async () => {
    mockedCourseService.listCourses.mockResolvedValue([]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
    mockedWorkItemService.createWorkItem.mockResolvedValue({
      id: "w1",
      assignmentId: "assignment-1",
      title: "Find three sources",
      effortMinutes: 20,
      completedAt: null,
    });
    const userEventInstance = userEvent.setup();

    render(
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} />,
    );
    await screen.findByRole("heading", { name: "Chapter 7 problem set" });

    await userEventInstance.click(screen.getByRole("button", { name: /add another step/i }));
    await userEventInstance.type(screen.getByLabelText(/^step$/i), "Find three sources");
    await userEventInstance.click(screen.getByRole("button", { name: /^add step$/i }));

    await waitFor(() =>
      expect(mockedWorkItemService.createWorkItem).toHaveBeenCalledWith(
        "student-1",
        expect.objectContaining({
          assignmentId: "assignment-1",
          title: "Find three sources",
        }),
      ),
    );
    expect(await screen.findByText("Find three sources")).toBeInTheDocument();
  });

  it("shows steps as read-only checkboxes reflecting completion", async () => {
    mockedCourseService.listCourses.mockResolvedValue([]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
    mockedWorkItemService.listWorkItems.mockResolvedValue([
      { id: "w1", assignmentId: "assignment-1", title: "Step 1", effortMinutes: 10, completedAt: "2026-03-01T00:00:00Z" },
      { id: "w2", assignmentId: "assignment-1", title: "Step 2", effortMinutes: 10, completedAt: null },
    ]);

    render(
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} />,
    );
    await screen.findByRole("heading", { name: "Chapter 7 problem set" });

    const step1 = await screen.findByRole("checkbox", { name: /step 1 complete/i });
    const step2 = screen.getByRole("checkbox", { name: /step 2 not yet complete/i });
    expect(step1).toBeChecked();
    expect(step1).toBeDisabled();
    expect(step2).not.toBeChecked();
    expect(step2).toBeDisabled();
  });

  it("marks the assignment and all open steps complete in one action", async () => {
    mockedCourseService.listCourses.mockResolvedValue([]);
    mockedAssignmentService.getAssignment.mockResolvedValue(assignment);
    mockedAssignmentService.completeAssignment.mockResolvedValue(undefined);
    mockedWorkItemService.listWorkItems.mockResolvedValue([
      { id: "w1", assignmentId: "assignment-1", title: "Step 1", effortMinutes: 10, completedAt: null },
    ]);
    mockedWorkItemService.completeAllForAssignment.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup();

    render(
      <AssignmentDetailPage user={user} assignmentId="assignment-1" onBack={vi.fn()} />,
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
    expect(await screen.findByText("Completed")).toBeInTheDocument();
  });
});
