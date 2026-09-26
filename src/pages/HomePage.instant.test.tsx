import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { User } from "@supabase/supabase-js";
import HomePage from "./HomePage";

// Instant screens (docs/features/instant-screen-data-v0.1.md) at the page
// level: Home rendered from the app's last-known copies, on first visit,
// and when a background refresh fails. The peeks are controllable here;
// HomePage.test.tsx covers everything else with no copies at all.

const copies = vi.hoisted(() => ({ known: false }));
const course = { id: "course-1", name: "Biology", colorIndex: 0 };
const assignment = {
  id: "a1",
  courseId: "course-1",
  title: "Lab report",
  dueDate: "2026-12-01",
  effortMinutes: 60,
  notes: null,
  completedAt: null,
};
const known = <T,>(value: T) => () => (copies.known ? value : undefined);

vi.mock("../services/courseService", () => ({
  peekCourses: vi.fn(),
  listCourses: vi.fn(),
}));
vi.mock("../services/assignmentService", () => ({
  peekAssignments: vi.fn(),
  peekAssignment: vi.fn(),
  listAssignments: vi.fn(),
}));
vi.mock("../services/workItemService", () => ({
  peekWorkItemsForStudent: vi.fn(),
  peekWorkItems: vi.fn(),
  listWorkItemsForStudent: vi.fn(),
}));
vi.mock("../services/activityService", () => ({
  peekActivities: vi.fn(),
  listActivities: vi.fn(),
}));
vi.mock("../services/workSessionService", () => ({
  peekWorkSessionsForDate: vi.fn(),
  peekWorkSessionsForStudent: vi.fn(),
  listWorkSessionsForDate: vi.fn(),
  listWorkSessionsForStudent: vi.fn(),
}));
vi.mock("../services/preferencesService", () => ({
  peekPreferences: vi.fn(),
  getPreferences: vi.fn(),
  DEFAULT_PREFERENCES: { weekdayFinishTime: "21:00", saturdayHours: 10, sundayHours: 10 },
}));

import * as courseService from "../services/courseService";
import * as assignmentService from "../services/assignmentService";
import * as workItemService from "../services/workItemService";
import * as activityService from "../services/activityService";
import * as workSessionService from "../services/workSessionService";
import * as preferencesService from "../services/preferencesService";

const user = { id: "student-1", email: "person@example.com" } as User;
const preferences = { weekdayFinishTime: "21:00", saturdayHours: 10, sundayHours: 10 };

function renderHome() {
  return render(
    <HomePage
      user={user}
      onStartExecution={vi.fn()}
      onGoToPlan={vi.fn()}
      onPlanWork={vi.fn()}
      onGoToAssignments={vi.fn()}
      onOpenAssignment={vi.fn()}
      onOpenCapture={vi.fn()}
      onOpenSettings={vi.fn()}
      onOpenSupport={vi.fn()}
      onOpenCourses={vi.fn()}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  copies.known = false;
  vi.mocked(courseService.peekCourses).mockImplementation(known([course]));
  vi.mocked(assignmentService.peekAssignments).mockImplementation(known([assignment]));
  vi.mocked(workItemService.peekWorkItemsForStudent).mockImplementation(known([]));
  vi.mocked(activityService.peekActivities).mockImplementation(known([]));
  vi.mocked(workSessionService.peekWorkSessionsForDate).mockImplementation(known([]));
  vi.mocked(workSessionService.peekWorkSessionsForStudent).mockImplementation(known([]));
  vi.mocked(preferencesService.peekPreferences).mockImplementation(known(preferences));
  // The server, slower than the first frame.
  vi.mocked(courseService.listCourses).mockResolvedValue([course]);
  vi.mocked(assignmentService.listAssignments).mockResolvedValue([assignment]);
  vi.mocked(workItemService.listWorkItemsForStudent).mockResolvedValue([]);
  vi.mocked(activityService.listActivities).mockResolvedValue([]);
  vi.mocked(workSessionService.listWorkSessionsForDate).mockResolvedValue([]);
  vi.mocked(workSessionService.listWorkSessionsForStudent).mockResolvedValue([]);
  vi.mocked(preferencesService.getPreferences).mockResolvedValue(preferences);
});

describe("Home, instant screens (instant-screen-data-v0.1.md)", () => {
  it("returning with copies: the content is there in the first render — no waiting, no placeholder", () => {
    copies.known = true;
    renderHome();

    // Synchronously: no findBy, no act.
    expect(screen.getByText("Lab report")).toBeInTheDocument();
    expect(document.querySelector("[aria-busy='true']")).toBeNull();
  });

  it("first visit (no copies): quiet placeholders, marked busy, then the content", async () => {
    renderHome();

    const busy = document.querySelector("[aria-busy='true']");
    expect(busy).not.toBeNull();
    expect(busy).toHaveTextContent("Loading…");
    expect(await screen.findByText("Lab report")).toBeInTheDocument();
    expect(document.querySelector("[aria-busy='true']")).toBeNull();
  });

  it("a failed refresh keeps the content, with the banner above it (I3)", async () => {
    copies.known = true;
    vi.mocked(assignmentService.listAssignments).mockRejectedValue({ message: "server error" });
    renderHome();

    expect(
      await screen.findByText("Couldn’t refresh. What’s shown may be out of date."),
    ).toBeInTheDocument();
    expect(screen.getByText("Lab report")).toBeInTheDocument();
    expect(screen.queryByText("Couldn’t load your day.")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument());
  });
});
