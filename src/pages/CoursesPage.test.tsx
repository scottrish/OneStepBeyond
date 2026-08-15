import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "@supabase/supabase-js";

vi.mock("../services/courseService", () => ({
  listCourses: vi.fn(),
  createCourse: vi.fn(),
  renameCourse: vi.fn(),
}));

import * as courseService from "../services/courseService";
import CoursesPage from "./CoursesPage";

const mockedService = courseService as unknown as {
  listCourses: ReturnType<typeof vi.fn>;
  createCourse: ReturnType<typeof vi.fn>;
  renameCourse: ReturnType<typeof vi.fn>;
};

const user = { id: "student-1", email: "person@example.com" } as User;

describe("CoursesPage", () => {
  it("shows the empty state and add form when there are no courses", async () => {
    mockedService.listCourses.mockResolvedValue([]);

    render(<CoursesPage user={user} onBack={vi.fn()} />);

    expect(await screen.findByText(/no courses yet/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/what.s it called\?/i),
    ).toBeInTheDocument();
  });

  it("shows a distinct error state, not the empty state, when the initial fetch fails", async () => {
    mockedService.listCourses.mockRejectedValue({ message: "server error" });

    render(<CoursesPage user={user} onBack={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /couldn.t load your courses/i,
    );
    expect(screen.queryByText(/no courses yet/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it("retries the fetch when Try again is clicked", async () => {
    mockedService.listCourses.mockRejectedValueOnce({ message: "server error" });
    mockedService.listCourses.mockResolvedValueOnce([
      { id: "1", name: "Biology", colorIndex: 0 },
    ]);
    const userEventInstance = userEvent.setup();

    render(<CoursesPage user={user} onBack={vi.fn()} />);
    await screen.findByRole("alert");

    await userEventInstance.click(
      screen.getByRole("button", { name: /try again/i }),
    );

    expect(
      await screen.findByRole("button", { name: "Biology" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("disables the add button until a name is entered", async () => {
    mockedService.listCourses.mockResolvedValue([]);
    const userEventInstance = userEvent.setup();

    render(<CoursesPage user={user} onBack={vi.fn()} />);
    await screen.findByText(/no courses yet/i);

    const addButton = screen.getByRole("button", { name: /add course/i });
    expect(addButton).toBeDisabled();

    await userEventInstance.type(
      screen.getByLabelText(/what.s it called\?/i),
      "Biology",
    );
    expect(addButton).toBeEnabled();
  });

  it("adds a course and clears the input", async () => {
    mockedService.listCourses.mockResolvedValue([]);
    mockedService.createCourse.mockResolvedValue({
      id: "1",
      name: "Biology",
      colorIndex: 0,
    });
    const userEventInstance = userEvent.setup();

    render(<CoursesPage user={user} onBack={vi.fn()} />);
    await screen.findByText(/no courses yet/i);

    const input = screen.getByLabelText(/what.s it called\?/i);
    await userEventInstance.type(input, "Biology");
    await userEventInstance.click(
      screen.getByRole("button", { name: /add course/i }),
    );

    expect(mockedService.createCourse).toHaveBeenCalledWith(
      "student-1",
      "Biology",
      0,
    );
    await waitFor(() => expect(input).toHaveValue(""));
  });

  it("keeps the typed name and shows the real error when adding fails", async () => {
    mockedService.listCourses.mockResolvedValue([]);
    mockedService.createCourse.mockRejectedValue({
      message: "permission denied",
    });
    const userEventInstance = userEvent.setup();

    render(<CoursesPage user={user} onBack={vi.fn()} />);
    await screen.findByText(/no courses yet/i);

    const input = screen.getByLabelText(/what.s it called\?/i);
    await userEventInstance.type(input, "Biology");
    await userEventInstance.click(
      screen.getByRole("button", { name: /add course/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "permission denied",
    );
    expect(input).toHaveValue("Biology");
    expect(screen.queryByText(/\[object Object\]/i)).not.toBeInTheDocument();
  });

  it("renames a course in place", async () => {
    mockedService.listCourses.mockResolvedValue([
      { id: "1", name: "Biology", colorIndex: 0 },
    ]);
    mockedService.renameCourse.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup();

    render(<CoursesPage user={user} onBack={vi.fn()} />);
    const nameButton = await screen.findByRole("button", { name: "Biology" });

    await userEventInstance.click(nameButton);
    const input = screen.getByLabelText(/rename biology/i);
    await userEventInstance.clear(input);
    await userEventInstance.type(input, "Biology II{Enter}");

    await waitFor(() =>
      expect(mockedService.renameCourse).toHaveBeenCalledWith(
        "1",
        "Biology II",
      ),
    );
    expect(
      await screen.findByRole("button", { name: "Biology II" }),
    ).toBeInTheDocument();
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
