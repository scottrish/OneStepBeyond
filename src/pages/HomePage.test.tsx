import { describe, expect, it, vi } from "vitest";
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
  createAssignment: vi.fn(),
  getAssignment: vi.fn(),
}));

vi.mock("../services/activityService", () => ({
  listActivities: vi.fn().mockResolvedValue([]),
  createActivity: vi.fn(),
  updateActivityDays: vi.fn(),
  deleteActivity: vi.fn(),
}));

const user = { id: "student-1", email: "person@example.com" } as User;

describe("HomePage", () => {
  it("renders the logged-in user's email", () => {
    render(<HomePage user={user} signOut={vi.fn()} />);

    expect(screen.getByText(/person@example.com/)).toBeInTheDocument();
  });

  it("navigates to Settings when the settings button is clicked", async () => {
    render(<HomePage user={user} signOut={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /settings/i }));

    expect(
      await screen.findByRole("heading", { name: /settings/i }),
    ).toBeInTheDocument();
  });

  it("navigates to Courses from Settings", async () => {
    render(<HomePage user={user} signOut={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /settings/i }));
    await userEvent.click(screen.getByRole("button", { name: /courses/i }));

    expect(await screen.findByRole("heading", { name: /courses/i })).toBeInTheDocument();
  });

  it("navigates to Activities from Settings", async () => {
    render(<HomePage user={user} signOut={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /settings/i }));
    await userEvent.click(screen.getByRole("button", { name: /activities/i }));

    expect(
      await screen.findByRole("heading", { name: /activities/i }),
    ).toBeInTheDocument();
  });

  it("calls signOut from Settings", async () => {
    const signOut = vi.fn();
    render(<HomePage user={user} signOut={signOut} />);

    await userEvent.click(screen.getByRole("button", { name: /settings/i }));
    await userEvent.click(screen.getByRole("button", { name: /sign out/i }));

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("navigates to New Assignment when the + button is clicked", async () => {
    render(<HomePage user={user} signOut={vi.fn()} />);

    await userEvent.click(
      screen.getByRole("button", { name: /new assignment/i }),
    );

    expect(
      await screen.findByRole("heading", { name: /new assignment/i }),
    ).toBeInTheDocument();
  });
});
