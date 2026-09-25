import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "@supabase/supabase-js";

vi.mock("../services/courseService", () => ({
  listCourses: vi.fn(),
  createCourse: vi.fn(),
  updateCourse: vi.fn(),
  deleteCourse: vi.fn(),
}));
vi.mock("../services/assignmentService", () => ({
  listAssignments: vi.fn(),
  updateAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
}));
vi.mock("../services/workItemService", () => ({
  listWorkItemsForStudent: vi.fn(),
}));

import * as courseService from "../services/courseService";
import * as assignmentService from "../services/assignmentService";
import * as workItemService from "../services/workItemService";
import CoursesPage from "./CoursesPage";

const mockedService = courseService as unknown as {
  listCourses: ReturnType<typeof vi.fn>;
  createCourse: ReturnType<typeof vi.fn>;
  updateCourse: ReturnType<typeof vi.fn>;
  deleteCourse: ReturnType<typeof vi.fn>;
};
const mockedAssignments = assignmentService as unknown as {
  listAssignments: ReturnType<typeof vi.fn>;
};
const mockedWorkItems = workItemService as unknown as {
  listWorkItemsForStudent: ReturnType<typeof vi.fn>;
};

const user = { id: "student-1", email: "person@example.com" } as User;

function assignment(id: string, courseId: string, completedAt: string | null = null) {
  return {
    id,
    courseId,
    title: `Assignment ${id}`,
    dueDate: "2026-03-20",
    effortMinutes: 60,
    notes: null,
    completedAt,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedAssignments.listAssignments.mockResolvedValue([]);
  mockedWorkItems.listWorkItemsForStudent.mockResolvedValue([]);
});

describe("CoursesPage", () => {
  it("shows the empty state and add form when there are no courses", async () => {
    mockedService.listCourses.mockResolvedValue([]);

    render(<CoursesPage user={user} onBack={vi.fn()} />);

    expect(await screen.findByText(/no courses yet/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Course name")).toBeInTheDocument();
  });

  it("shows a distinct error state, not the empty state, when the initial fetch fails", async () => {
    mockedService.listCourses.mockRejectedValue({ message: "server error" });

    render(<CoursesPage user={user} onBack={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t load your courses/i);
    expect(screen.queryByText(/no courses yet/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("retries the fetch when Try again is clicked", async () => {
    mockedService.listCourses.mockRejectedValueOnce({ message: "server error" });
    mockedService.listCourses.mockResolvedValueOnce([{ id: "1", name: "Biology", colorIndex: 0 }]);
    const userEventInstance = userEvent.setup();

    render(<CoursesPage user={user} onBack={vi.fn()} />);
    await screen.findByRole("alert");

    await userEventInstance.click(screen.getByRole("button", { name: /try again/i }));

    expect(await screen.findByText("Biology")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  describe("adding a course with a colour", () => {
    it("disables Add until a name is entered", async () => {
      mockedService.listCourses.mockResolvedValue([]);
      const userEventInstance = userEvent.setup();

      render(<CoursesPage user={user} onBack={vi.fn()} />);
      await screen.findByText(/no courses yet/i);

      const addButton = screen.getByRole("button", { name: /add course/i });
      expect(addButton).toBeDisabled();
      await userEventInstance.type(screen.getByLabelText("Course name"), "Biology");
      expect(addButton).toBeEnabled();
    });

    it("pre-selects a colour no existing course uses, and adds with it", async () => {
      mockedService.listCourses.mockResolvedValue([
        { id: "1", name: "Biology", colorIndex: 0 },
        { id: "2", name: "Algebra", colorIndex: 1 },
      ]);
      mockedService.createCourse.mockResolvedValue({ id: "3", name: "Chemistry", colorIndex: 2 });
      const userEventInstance = userEvent.setup();

      render(<CoursesPage user={user} onBack={vi.fn()} />);
      await screen.findByText("Biology");

      const picker = screen.getByRole("group", { name: "Colour for the new course" });
      expect(within(picker).getByRole("button", { name: "Amber" })).toHaveAttribute("aria-pressed", "true");

      const input = screen.getByLabelText("Course name");
      await userEventInstance.type(input, "Chemistry");
      await userEventInstance.click(screen.getByRole("button", { name: /add course/i }));

      expect(mockedService.createCourse).toHaveBeenCalledWith("student-1", "Chemistry", 2);
      await waitFor(() => expect(input).toHaveValue(""));
      // The next default moves on to a colour that's still free.
      expect(within(picker).getByRole("button", { name: "Violet" })).toHaveAttribute("aria-pressed", "true");
    });

    it("offers all 8 named colours and adds with the one chosen", async () => {
      mockedService.listCourses.mockResolvedValue([]);
      mockedService.createCourse.mockResolvedValue({ id: "1", name: "Art", colorIndex: 6 });
      const userEventInstance = userEvent.setup();

      render(<CoursesPage user={user} onBack={vi.fn()} />);
      await screen.findByText(/no courses yet/i);

      const picker = screen.getByRole("group", { name: "Colour for the new course" });
      expect(within(picker).getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual([
        "Clay",
        "Fern",
        "Amber",
        "Violet",
        "Slate blue",
        "Teal",
        "Rose",
        "Moss",
      ]);
      await userEventInstance.click(within(picker).getByRole("button", { name: "Rose" }));
      expect(within(picker).getByRole("button", { name: "Rose" })).toHaveAttribute("aria-pressed", "true");
      expect(within(picker).getByRole("button", { name: "Clay" })).toHaveAttribute("aria-pressed", "false");

      await userEventInstance.type(screen.getByLabelText("Course name"), "Art");
      await userEventInstance.click(screen.getByRole("button", { name: /add course/i }));

      expect(mockedService.createCourse).toHaveBeenCalledWith("student-1", "Art", 6);
    });

    it("keeps the typed name and shows the real error when adding fails", async () => {
      mockedService.listCourses.mockResolvedValue([]);
      mockedService.createCourse.mockRejectedValue({ message: "permission denied" });
      const userEventInstance = userEvent.setup();

      render(<CoursesPage user={user} onBack={vi.fn()} />);
      await screen.findByText(/no courses yet/i);

      const input = screen.getByLabelText("Course name");
      await userEventInstance.type(input, "Biology");
      await userEventInstance.click(screen.getByRole("button", { name: /add course/i }));

      expect(await screen.findByRole("alert")).toHaveTextContent("permission denied");
      expect(input).toHaveValue("Biology");
    });
  });

  describe("editing a course", () => {
    beforeEach(() => {
      mockedService.listCourses.mockResolvedValue([{ id: "1", name: "Biology", colorIndex: 0 }]);
    });

    it("Save changes the name and colour together", async () => {
      mockedService.updateCourse.mockResolvedValue(undefined);
      const userEventInstance = userEvent.setup();

      render(<CoursesPage user={user} onBack={vi.fn()} />);
      await userEventInstance.click(await screen.findByRole("button", { name: "Edit Biology" }));

      const nameInput = screen.getByLabelText("Course name", { selector: "[aria-label]" });
      await userEventInstance.clear(nameInput);
      await userEventInstance.type(nameInput, "Biology II");
      const picker = screen.getByRole("group", { name: "Colour for Biology" });
      await userEventInstance.click(within(picker).getByRole("button", { name: "Teal" }));
      await userEventInstance.click(screen.getByRole("button", { name: "Save" }));

      expect(mockedService.updateCourse).toHaveBeenCalledTimes(1);
      expect(mockedService.updateCourse).toHaveBeenCalledWith("1", { name: "Biology II", colorIndex: 5 });
      expect(await screen.findByText("Biology II")).toBeInTheDocument();
    });

    it("Cancel discards both, and the next edit starts from what's saved", async () => {
      const userEventInstance = userEvent.setup();

      render(<CoursesPage user={user} onBack={vi.fn()} />);
      await userEventInstance.click(await screen.findByRole("button", { name: "Edit Biology" }));
      const nameInput = screen.getByLabelText("Course name", { selector: "[aria-label]" });
      await userEventInstance.clear(nameInput);
      await userEventInstance.type(nameInput, "Changed");
      await userEventInstance.click(screen.getByRole("button", { name: "Cancel" }));

      expect(mockedService.updateCourse).not.toHaveBeenCalled();
      expect(screen.getByText("Biology")).toBeInTheDocument();

      await userEventInstance.click(screen.getByRole("button", { name: "Edit Biology" }));
      expect(screen.getByLabelText("Course name", { selector: "[aria-label]" })).toHaveValue("Biology");
    });
  });

  describe("deleting a course", () => {
    it("shows each course's assignment count, including completed assignments", async () => {
      mockedService.listCourses.mockResolvedValue([
        { id: "1", name: "Biology", colorIndex: 0 },
        { id: "2", name: "Algebra", colorIndex: 1 },
        { id: "3", name: "Art", colorIndex: 2 },
      ]);
      mockedAssignments.listAssignments.mockResolvedValue([
        assignment("a1", "1"),
        assignment("a2", "1", "2026-03-10T00:00:00Z"),
        assignment("a3", "2"),
      ]);

      render(<CoursesPage user={user} onBack={vi.fn()} />);

      expect(await screen.findByText("2 assignments")).toBeInTheDocument();
      expect(screen.getByText("1 assignment")).toBeInTheDocument();
      expect(screen.getByText("No assignments")).toBeInTheDocument();
    });

    it("an empty course asks plainly, and Delete removes only it", async () => {
      mockedService.listCourses.mockResolvedValue([{ id: "1", name: "Biology", colorIndex: 0 }]);
      mockedService.deleteCourse.mockResolvedValue(undefined);
      const userEventInstance = userEvent.setup();

      render(<CoursesPage user={user} onBack={vi.fn()} />);
      await screen.findByText("No assignments");
      await userEventInstance.click(screen.getByRole("button", { name: "More actions for Biology" }));
      await userEventInstance.click(await screen.findByRole("menuitem", { name: "Delete" }));

      const confirm = screen.getByRole("group", { name: "Delete Biology" });
      expect(confirm).toHaveTextContent("Delete Biology?");
      expect(confirm).not.toHaveTextContent(/can’t be undone/);
      await waitFor(() => expect(within(confirm).getByRole("button", { name: "Keep it" })).toHaveFocus());

      await userEventInstance.click(within(confirm).getByRole("button", { name: "Delete" }));

      expect(mockedService.deleteCourse).toHaveBeenCalledWith("1");
      await waitFor(() => expect(screen.queryByText("Biology")).not.toBeInTheDocument());
    });

    it("a course with assignments warns that every one goes, whatever its state, with the count", async () => {
      mockedService.listCourses.mockResolvedValue([{ id: "1", name: "Biology", colorIndex: 0 }]);
      mockedAssignments.listAssignments.mockResolvedValue([
        assignment("a1", "1"),
        assignment("a2", "1"),
        assignment("a3", "1", "2026-03-10T00:00:00Z"),
      ]);
      const userEventInstance = userEvent.setup();

      render(<CoursesPage user={user} onBack={vi.fn()} />);
      await screen.findByText("3 assignments");
      await userEventInstance.click(screen.getByRole("button", { name: "More actions for Biology" }));
      await userEventInstance.click(await screen.findByRole("menuitem", { name: "Delete" }));

      const confirm = screen.getByRole("group", { name: "Delete Biology" });
      expect(confirm).toHaveTextContent("Delete Biology and all its assignments?");
      expect(confirm).toHaveTextContent(
        "This also deletes its 3 assignments: ones you haven’t planned yet, ones you’ve planned, and ones you’ve completed.",
      );
      expect(confirm).toHaveTextContent("This can’t be undone.");
    });

    it("Keep it leaves the course alone", async () => {
      mockedService.listCourses.mockResolvedValue([{ id: "1", name: "Biology", colorIndex: 0 }]);
      const userEventInstance = userEvent.setup();

      render(<CoursesPage user={user} onBack={vi.fn()} />);
      await screen.findByText("No assignments");
      await userEventInstance.click(screen.getByRole("button", { name: "More actions for Biology" }));
      await userEventInstance.click(await screen.findByRole("menuitem", { name: "Delete" }));
      await userEventInstance.click(screen.getByRole("button", { name: "Keep it" }));

      expect(mockedService.deleteCourse).not.toHaveBeenCalled();
      expect(screen.queryByRole("group", { name: "Delete Biology" })).not.toBeInTheDocument();
      expect(screen.getByText("Biology")).toBeInTheDocument();
    });

    it("can't be confirmed when the assignment count couldn't be loaded", async () => {
      mockedService.listCourses.mockResolvedValue([{ id: "1", name: "Biology", colorIndex: 0 }]);
      mockedAssignments.listAssignments.mockRejectedValue({ message: "network down" });
      const userEventInstance = userEvent.setup();

      render(<CoursesPage user={user} onBack={vi.fn()} />);
      await screen.findByText("Biology");
      await userEventInstance.click(screen.getByRole("button", { name: "More actions for Biology" }));
      await userEventInstance.click(await screen.findByRole("menuitem", { name: "Delete" }));

      const confirm = screen.getByRole("group", { name: "Delete Biology" });
      expect(confirm).toHaveTextContent(/can’t be deleted right now/);
      expect(within(confirm).getByRole("button", { name: "Delete" })).toBeDisabled();
    });

    it("swiping a course reveals Delete, which opens the same confirmation (never deletes directly)", async () => {
      mockedService.listCourses.mockResolvedValue([{ id: "1", name: "Biology", colorIndex: 0 }]);
      render(<CoursesPage user={user} onBack={vi.fn()} />);

      const title = await screen.findByText("Biology");
      await screen.findByText("No assignments");
      const surface = title.closest("[data-swipe-content]")!;
      const start = { clientX: 300, clientY: 100, pointerId: 1, pointerType: "touch" };
      fireEvent.pointerDown(title, start);
      for (const x of [290, 270, 250, 230, 210]) fireEvent.pointerMove(surface, { ...start, clientX: x });
      fireEvent.pointerUp(surface, { ...start, clientX: 210 });
      fireEvent.click(screen.getByRole("button", { name: "Delete Biology" }));

      expect(mockedService.deleteCourse).not.toHaveBeenCalled();
      expect(screen.getByRole("group", { name: "Delete Biology" })).toHaveTextContent("Delete Biology?");
    });
  });

  it("calls onBack when the back button is clicked", async () => {
    mockedService.listCourses.mockResolvedValue([]);
    const onBack = vi.fn();
    const userEventInstance = userEvent.setup();

    render(<CoursesPage user={user} onBack={onBack} />);
    await screen.findByText(/no courses yet/i);

    await userEventInstance.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
