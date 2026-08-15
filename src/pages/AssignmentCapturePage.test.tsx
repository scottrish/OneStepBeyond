import { describe, expect, it, vi } from "vitest";
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
}));

import * as courseService from "../services/courseService";
import * as assignmentService from "../services/assignmentService";
import { tomorrowDateString } from "../domain/dueDate";
import AssignmentCapturePage from "./AssignmentCapturePage";

const mockedCourseService = courseService as unknown as {
  listCourses: ReturnType<typeof vi.fn>;
};
const mockedAssignmentService = assignmentService as unknown as {
  createAssignment: ReturnType<typeof vi.fn>;
};

const user = { id: "student-1", email: "person@example.com" } as User;

const courses = [
  { id: "course-1", name: "Biology", colorIndex: 0 },
  { id: "course-2", name: "Algebra I", colorIndex: 1 },
];

describe("AssignmentCapturePage", () => {
  it("shows an empty-courses state with a way to add one, when there are no courses", async () => {
    mockedCourseService.listCourses.mockResolvedValue([]);
    const onGoToCourses = vi.fn();
    const userEventInstance = userEvent.setup();

    render(
      <AssignmentCapturePage
        user={user}
        onCancel={vi.fn()}
        onGoToCourses={onGoToCourses}
        onSaved={vi.fn()}
      />,
    );

    expect(
      await screen.findByText(/don.t have any courses yet/i),
    ).toBeInTheDocument();

    await userEventInstance.click(
      screen.getByRole("button", { name: /add a course/i }),
    );
    expect(onGoToCourses).toHaveBeenCalledTimes(1);
  });

  it("disables Save until a course and a title are chosen", async () => {
    mockedCourseService.listCourses.mockResolvedValue(courses);
    const userEventInstance = userEvent.setup();

    render(
      <AssignmentCapturePage
        user={user}
        onCancel={vi.fn()}
        onGoToCourses={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    const saveButton = await screen.findByRole("button", { name: /save/i });
    expect(saveButton).toBeDisabled();

    await userEventInstance.click(
      screen.getByRole("radio", { name: "Biology" }),
    );
    expect(saveButton).toBeDisabled();

    await userEventInstance.type(
      screen.getByLabelText(/what is it\?/i),
      "Chapter 7 problem set",
    );
    expect(saveButton).toBeEnabled();
  });

  it("defaults due date to tomorrow and effort to 30m", async () => {
    mockedCourseService.listCourses.mockResolvedValue(courses);

    render(
      <AssignmentCapturePage
        user={user}
        onCancel={vi.fn()}
        onGoToCourses={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    await screen.findByRole("radio", { name: "Biology" });

    expect(screen.getByLabelText(/due/i)).toHaveValue(tomorrowDateString());
    expect(screen.getByRole("radio", { name: "30m" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("lets the student switch the selected effort chip", async () => {
    mockedCourseService.listCourses.mockResolvedValue(courses);
    const userEventInstance = userEvent.setup();

    render(
      <AssignmentCapturePage
        user={user}
        onCancel={vi.fn()}
        onGoToCourses={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    await screen.findByRole("radio", { name: "30m" });
    await userEventInstance.click(screen.getByRole("radio", { name: "1h" }));

    expect(screen.getByRole("radio", { name: "1h" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "30m" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("saves the assignment and calls onSaved with its id", async () => {
    mockedCourseService.listCourses.mockResolvedValue(courses);
    mockedAssignmentService.createAssignment.mockResolvedValue({
      id: "assignment-1",
      courseId: "course-1",
      title: "Chapter 7 problem set",
      dueDate: "2026-03-15",
      effortMinutes: 30,
      notes: null,
    });
    const onSaved = vi.fn();
    const userEventInstance = userEvent.setup();

    render(
      <AssignmentCapturePage
        user={user}
        onCancel={vi.fn()}
        onGoToCourses={vi.fn()}
        onSaved={onSaved}
      />,
    );

    await userEventInstance.click(
      await screen.findByRole("radio", { name: "Biology" }),
    );
    await userEventInstance.type(
      screen.getByLabelText(/what is it\?/i),
      "Chapter 7 problem set",
    );
    await userEventInstance.click(
      screen.getByRole("button", { name: /^save$/i }),
    );

    await waitFor(() =>
      expect(mockedAssignmentService.createAssignment).toHaveBeenCalledWith(
        "student-1",
        expect.objectContaining({
          courseId: "course-1",
          title: "Chapter 7 problem set",
          effortMinutes: 30,
        }),
      ),
    );
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith("assignment-1"));
  });

  it("shows the real error and does not navigate when saving fails", async () => {
    mockedCourseService.listCourses.mockResolvedValue(courses);
    mockedAssignmentService.createAssignment.mockRejectedValue({
      message: "permission denied",
    });
    const onSaved = vi.fn();
    const userEventInstance = userEvent.setup();

    render(
      <AssignmentCapturePage
        user={user}
        onCancel={vi.fn()}
        onGoToCourses={vi.fn()}
        onSaved={onSaved}
      />,
    );

    await userEventInstance.click(
      await screen.findByRole("radio", { name: "Biology" }),
    );
    await userEventInstance.type(
      screen.getByLabelText(/what is it\?/i),
      "Chapter 7 problem set",
    );
    await userEventInstance.click(
      screen.getByRole("button", { name: /^save$/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "permission denied",
    );
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("calls onCancel when Cancel is clicked", async () => {
    mockedCourseService.listCourses.mockResolvedValue([]);
    const onCancel = vi.fn();
    const userEventInstance = userEvent.setup();

    render(
      <AssignmentCapturePage
        user={user}
        onCancel={onCancel}
        onGoToCourses={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    await userEventInstance.click(
      screen.getByRole("button", { name: /cancel/i }),
    );
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
