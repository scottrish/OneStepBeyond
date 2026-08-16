import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "@supabase/supabase-js";

vi.mock("../services/assignmentService", () => ({
  updateAssignment: vi.fn(),
}));
vi.mock("../services/decompositionAttemptService", () => ({
  recordDecompositionAttempt: vi.fn(),
}));
vi.mock("../services/workItemService", () => ({
  createWorkItems: vi.fn(),
  deleteWorkItems: vi.fn(),
}));

import * as assignmentService from "../services/assignmentService";
import * as decompositionAttemptService from "../services/decompositionAttemptService";
import * as workItemService from "../services/workItemService";
import WorkBreakdownPage from "./WorkBreakdownPage";

const mockedAssignmentService = assignmentService as unknown as {
  updateAssignment: ReturnType<typeof vi.fn>;
};
const mockedDecompositionAttemptService = decompositionAttemptService as unknown as {
  recordDecompositionAttempt: ReturnType<typeof vi.fn>;
};
const mockedWorkItemService = workItemService as unknown as {
  createWorkItems: ReturnType<typeof vi.fn>;
  deleteWorkItems: ReturnType<typeof vi.fn>;
};

const user = { id: "student-1", email: "person@example.com" } as User;

const assignment = {
  id: "a1",
  courseId: "course-1",
  title: "Book report",
  dueDate: "2026-03-15",
  effortMinutes: 30,
  notes: null,
  completedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("WorkBreakdownPage", () => {
  it("walks through create, estimate, and confirm for a first-time breakdown", async () => {
    const created = [
      { id: "w1", assignmentId: "a1", title: "Finish book", effortMinutes: 60, completedAt: null, position: 0 },
      { id: "w2", assignmentId: "a1", title: "Write report", effortMinutes: 45, completedAt: null, position: 1 },
    ];
    mockedWorkItemService.createWorkItems.mockResolvedValue(created);
    mockedAssignmentService.updateAssignment.mockResolvedValue(undefined);
    mockedDecompositionAttemptService.recordDecompositionAttempt.mockResolvedValue(undefined);
    const onConfirmed = vi.fn();
    const userEventInstance = userEvent.setup();

    render(
      <WorkBreakdownPage
        user={user}
        assignment={assignment}
        confirmedItems={[]}
        onCancel={vi.fn()}
        onConfirmed={onConfirmed}
      />,
    );

    expect(screen.getByText(/what are the main pieces/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^next$/i })).toBeDisabled();

    const addInput = screen.getByPlaceholderText(/questions 1–10/i);
    await userEventInstance.type(addInput, "Finish book");
    await userEventInstance.click(screen.getByRole("button", { name: /^add$/i }));
    await userEventInstance.type(addInput, "Write report");
    await userEventInstance.click(screen.getByRole("button", { name: /^add$/i }));

    expect(screen.getByDisplayValue("Finish book")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Write report")).toBeInTheDocument();

    await userEventInstance.click(screen.getByRole("button", { name: /^next$/i }));

    expect(screen.getByText(/how long will each piece take/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^next$/i })).toBeDisabled();

    await userEventInstance.click(
      within(
        screen.getByRole("radiogroup", { name: /estimated time for finish book/i }),
      ).getByRole("radio", { name: "1h" }),
    );

    await userEventInstance.click(
      within(
        screen.getByRole("radiogroup", { name: /estimated time for write report/i }),
      ).getByRole("radio", { name: "45m" }),
    );

    await userEventInstance.click(screen.getByRole("button", { name: /^next$/i }));

    expect(screen.getByText(/does this look like how/i)).toBeInTheDocument();
    expect(screen.getByText("Finish book")).toBeInTheDocument();
    expect(screen.getByText("Write report")).toBeInTheDocument();
    expect(screen.getByText(/about 105 min total/i)).toBeInTheDocument();

    await userEventInstance.click(screen.getByRole("button", { name: /looks good/i }));

    expect(mockedWorkItemService.createWorkItems).toHaveBeenCalledWith("student-1", [
      { assignmentId: "a1", title: "Finish book", effortMinutes: 60, position: 0 },
      { assignmentId: "a1", title: "Write report", effortMinutes: 45, position: 1 },
    ]);
    expect(onConfirmed).toHaveBeenCalledWith(created);
  });

  it("seeds the draft from confirmedItems when editing an existing breakdown", () => {
    render(
      <WorkBreakdownPage
        user={user}
        assignment={assignment}
        confirmedItems={[
          { id: "w1", assignmentId: "a1", title: "Read book", effortMinutes: 90, completedAt: null, position: 0 },
        ]}
        onCancel={vi.fn()}
        onConfirmed={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("Read book")).toBeInTheDocument();
  });

  it("deleting a step removes it from the draft", async () => {
    const userEventInstance = userEvent.setup();

    render(
      <WorkBreakdownPage
        user={user}
        assignment={assignment}
        confirmedItems={[
          { id: "w1", assignmentId: "a1", title: "Read book", effortMinutes: 90, completedAt: null, position: 0 },
        ]}
        onCancel={vi.fn()}
        onConfirmed={vi.fn()}
      />,
    );

    await userEventInstance.click(screen.getByRole("button", { name: /delete read book/i }));

    expect(screen.queryByDisplayValue("Read book")).not.toBeInTheDocument();
  });

  it("reordering moves a step up", async () => {
    const userEventInstance = userEvent.setup();

    render(
      <WorkBreakdownPage
        user={user}
        assignment={assignment}
        confirmedItems={[
          { id: "w1", assignmentId: "a1", title: "First", effortMinutes: 20, completedAt: null, position: 0 },
          { id: "w2", assignmentId: "a1", title: "Second", effortMinutes: 20, completedAt: null, position: 1 },
        ]}
        onCancel={vi.fn()}
        onConfirmed={vi.fn()}
      />,
    );

    await userEventInstance.click(screen.getByRole("button", { name: /move second up/i }));

    const inputs = screen.getAllByRole("textbox");
    expect(inputs[0]).toHaveValue("Second");
    expect(inputs[1]).toHaveValue("First");
  });

  it("cancel calls onCancel without touching the server", async () => {
    const onCancel = vi.fn();
    const userEventInstance = userEvent.setup();

    render(
      <WorkBreakdownPage
        user={user}
        assignment={assignment}
        confirmedItems={[]}
        onCancel={onCancel}
        onConfirmed={vi.fn()}
      />,
    );

    await userEventInstance.type(
      screen.getByPlaceholderText(/questions 1–10/i),
      "Something I typed",
    );
    await userEventInstance.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(mockedWorkItemService.createWorkItems).not.toHaveBeenCalled();
  });
});
