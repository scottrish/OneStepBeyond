import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
}));

import * as courseService from "../services/courseService";
import * as assignmentService from "../services/assignmentService";
import AssignmentDetailPage from "./AssignmentDetailPage";

const mockedCourseService = courseService as unknown as {
  listCourses: ReturnType<typeof vi.fn>;
};
const mockedAssignmentService = assignmentService as unknown as {
  getAssignment: ReturnType<typeof vi.fn>;
};

const user = { id: "student-1", email: "person@example.com" } as User;

describe("AssignmentDetailPage", () => {
  it("shows the assignment's course, title, due date, effort, and notes", async () => {
    mockedCourseService.listCourses.mockResolvedValue([
      { id: "course-1", name: "Biology", colorIndex: 0 },
    ]);
    mockedAssignmentService.getAssignment.mockResolvedValue({
      id: "assignment-1",
      courseId: "course-1",
      title: "Chapter 7 problem set",
      dueDate: "2026-03-15",
      effortMinutes: 30,
      notes: "Bring a calculator",
    });

    render(
      <AssignmentDetailPage
        user={user}
        assignmentId="assignment-1"
        onBack={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Chapter 7 problem set" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Biology")).toBeInTheDocument();
    expect(screen.getByText("March 15, 2026")).toBeInTheDocument();
    expect(screen.getByText("30m")).toBeInTheDocument();
    expect(screen.getByText("Bring a calculator")).toBeInTheDocument();
  });

  it("omits the notes section when there are no notes", async () => {
    mockedCourseService.listCourses.mockResolvedValue([
      { id: "course-1", name: "Biology", colorIndex: 0 },
    ]);
    mockedAssignmentService.getAssignment.mockResolvedValue({
      id: "assignment-1",
      courseId: "course-1",
      title: "Chapter 7 problem set",
      dueDate: "2026-03-15",
      effortMinutes: 30,
      notes: null,
    });

    render(
      <AssignmentDetailPage
        user={user}
        assignmentId="assignment-1"
        onBack={vi.fn()}
      />,
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
      <AssignmentDetailPage
        user={user}
        assignmentId="missing"
        onBack={vi.fn()}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /couldn.t load this assignment/i,
    );
  });

  it("calls onBack when the back button is clicked", async () => {
    mockedCourseService.listCourses.mockResolvedValue([]);
    mockedAssignmentService.getAssignment.mockResolvedValue({
      id: "assignment-1",
      courseId: "course-1",
      title: "Chapter 7 problem set",
      dueDate: "2026-03-15",
      effortMinutes: 30,
      notes: null,
    });
    const onBack = vi.fn();
    const userEventInstance = userEvent.setup();

    render(
      <AssignmentDetailPage
        user={user}
        assignmentId="assignment-1"
        onBack={onBack}
      />,
    );

    await userEventInstance.click(
      screen.getByRole("button", { name: /back/i }),
    );
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
