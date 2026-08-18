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
    expect(screen.getByText(/about 1h 45m total/i)).toBeInTheDocument();

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

  it("shows completed items read-only, separate from the editable list, with no edit/delete/reorder controls", () => {
    // docs/features/work-breakdown-revision-preserves-completed-items.md —
    // completed items can't be renamed, estimated, reordered, or deleted
    // through this flow.
    render(
      <WorkBreakdownPage
        user={user}
        assignment={assignment}
        confirmedItems={[
          {
            id: "w1",
            assignmentId: "a1",
            title: "Read book",
            effortMinutes: 90,
            completedAt: "2026-03-14T00:00:00Z",
            position: 0,
          },
          { id: "w2", assignmentId: "a1", title: "Write report", effortMinutes: 45, completedAt: null, position: 1 },
        ]}
        onCancel={vi.fn()}
        onConfirmed={vi.fn()}
      />,
    );

    expect(screen.getByText("Read book")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /read book complete/i })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: /read book complete/i })).toBeChecked();
    expect(screen.queryByDisplayValue("Read book")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /delete read book/i }),
    ).not.toBeInTheDocument();

    // The still-open item is unaffected — normal editable row.
    expect(screen.getByDisplayValue("Write report")).toBeInTheDocument();
  });

  it("never deletes or recreates a completed item when confirming a revision", async () => {
    const created = [
      { id: "w3", assignmentId: "a1", title: "Write report", effortMinutes: 45, completedAt: null, position: 1 },
    ];
    mockedWorkItemService.createWorkItems.mockResolvedValue(created);
    mockedAssignmentService.updateAssignment.mockResolvedValue(undefined);
    mockedDecompositionAttemptService.recordDecompositionAttempt.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup();

    render(
      <WorkBreakdownPage
        user={user}
        assignment={assignment}
        confirmedItems={[
          {
            id: "w1",
            assignmentId: "a1",
            title: "Read book",
            effortMinutes: 90,
            completedAt: "2026-03-14T00:00:00Z",
            position: 0,
          },
          { id: "w2", assignmentId: "a1", title: "Write report", effortMinutes: 45, completedAt: null, position: 1 },
        ]}
        onCancel={vi.fn()}
        onConfirmed={vi.fn()}
      />,
    );

    await userEventInstance.click(screen.getByRole("button", { name: /^next$/i }));
    await userEventInstance.click(
      within(
        screen.getByRole("radiogroup", { name: /estimated time for write report/i }),
      ).getByRole("radio", { name: "45m" }),
    );
    await userEventInstance.click(screen.getByRole("button", { name: /^next$/i }));

    // The review step's total covers only the editable steps being
    // confirmed, and says so when a completed step exists.
    expect(screen.getByText(/about 45m total for these steps/i)).toBeInTheDocument();
    expect(screen.getByText(/completed steps aren.t shown here/i)).toBeInTheDocument();

    await userEventInstance.click(screen.getByRole("button", { name: /looks good/i }));

    expect(mockedWorkItemService.createWorkItems).toHaveBeenCalledWith("student-1", [
      { assignmentId: "a1", title: "Write report", effortMinutes: 45, position: 1 },
    ]);
    expect(mockedWorkItemService.deleteWorkItems).toHaveBeenCalledWith(["w2"]);
  });

  it("lets the student proceed once a new item is added, even when every existing item is already complete", async () => {
    const userEventInstance = userEvent.setup();

    render(
      <WorkBreakdownPage
        user={user}
        assignment={assignment}
        confirmedItems={[
          {
            id: "w1",
            assignmentId: "a1",
            title: "Read book",
            effortMinutes: 90,
            completedAt: "2026-03-14T00:00:00Z",
            position: 0,
          },
        ]}
        onCancel={vi.fn()}
        onConfirmed={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /^next$/i })).toBeDisabled();

    await userEventInstance.type(
      screen.getByPlaceholderText(/questions 1–10/i),
      "Write report",
    );
    await userEventInstance.click(screen.getByRole("button", { name: /^add$/i }));

    expect(screen.getByRole("button", { name: /^next$/i })).toBeEnabled();
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

  describe("Understanding prompt (docs/features/assignment-detail-cta-hierarchy.md item 3a, Correction 5)", () => {
    it("shows two tappable prompts and hides the add-step UI until one is resolved", () => {
      render(
        <WorkBreakdownPage
          user={user}
          assignment={assignment}
          confirmedItems={[]}
          onCancel={vi.fn()}
          onConfirmed={vi.fn()}
          showUnderstandingPrompt
        />,
      );

      expect(
        screen.getByRole("button", { name: /paste what the teacher said/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /say it in my own words/i }),
      ).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/questions 1–10/i)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^next$/i })).not.toBeInTheDocument();
    });

    it("choosing a prompt reveals one textarea with the matching placeholder", async () => {
      const userEventInstance = userEvent.setup();

      render(
        <WorkBreakdownPage
          user={user}
          assignment={assignment}
          confirmedItems={[]}
          onCancel={vi.fn()}
          onConfirmed={vi.fn()}
          showUnderstandingPrompt
        />,
      );

      await userEventInstance.click(
        screen.getByRole("button", { name: /say it in my own words/i }),
      );

      expect(screen.getByPlaceholderText(/what do you have to do\?/i)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /paste what the teacher said/i }),
      ).not.toBeInTheDocument();
    });

    it("shows the 'paste' placeholder for either 'Paste what the teacher said' or the (dropped) assisted framing", async () => {
      const userEventInstance = userEvent.setup();

      render(
        <WorkBreakdownPage
          user={user}
          assignment={assignment}
          confirmedItems={[]}
          onCancel={vi.fn()}
          onConfirmed={vi.fn()}
          showUnderstandingPrompt
        />,
      );

      await userEventInstance.click(
        screen.getByRole("button", { name: /paste what the teacher said/i }),
      );

      expect(screen.getByPlaceholderText(/paste the directions here/i)).toBeInTheDocument();
    });

    it("blurring an empty textarea leaves the add-step UI hidden and saves nothing", async () => {
      const onSaveNotes = vi.fn();
      const userEventInstance = userEvent.setup();

      render(
        <WorkBreakdownPage
          user={user}
          assignment={assignment}
          confirmedItems={[]}
          onCancel={vi.fn()}
          onConfirmed={vi.fn()}
          showUnderstandingPrompt
          onSaveNotes={onSaveNotes}
        />,
      );

      await userEventInstance.click(
        screen.getByRole("button", { name: /say it in my own words/i }),
      );
      await userEventInstance.click(document.body); // blur without typing anything

      expect(onSaveNotes).not.toHaveBeenCalled();
      expect(screen.queryByPlaceholderText(/questions 1–10/i)).not.toBeInTheDocument();
    });

    it("blurring a non-empty textarea saves it and reveals the add-step UI", async () => {
      const onSaveNotes = vi.fn().mockResolvedValue(undefined);
      const userEventInstance = userEvent.setup();

      render(
        <WorkBreakdownPage
          user={user}
          assignment={assignment}
          confirmedItems={[]}
          onCancel={vi.fn()}
          onConfirmed={vi.fn()}
          showUnderstandingPrompt
          onSaveNotes={onSaveNotes}
        />,
      );

      await userEventInstance.click(
        screen.getByRole("button", { name: /say it in my own words/i }),
      );
      await userEventInstance.type(
        screen.getByPlaceholderText(/what do you have to do\?/i),
        "Write a 2-page book report",
      );
      await userEventInstance.click(document.body); // blur

      expect(onSaveNotes).toHaveBeenCalledWith("Write a 2-page book report");
      expect(screen.getByText("Write a 2-page book report")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/questions 1–10/i)).toBeInTheDocument();
    });

    it("shows existing notes read-only and the add-step UI immediately, without any prompt", () => {
      render(
        <WorkBreakdownPage
          user={user}
          assignment={{ ...assignment, notes: "Read chapters 3-5 and summarize" }}
          confirmedItems={[]}
          onCancel={vi.fn()}
          onConfirmed={vi.fn()}
          showUnderstandingPrompt
        />,
      );

      expect(screen.getByText("Read chapters 3-5 and summarize")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /paste what the teacher said/i }),
      ).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText(/questions 1–10/i)).toBeInTheDocument();
    });

    it("'Back' from the textarea returns to the two prompts", async () => {
      const userEventInstance = userEvent.setup();

      render(
        <WorkBreakdownPage
          user={user}
          assignment={assignment}
          confirmedItems={[]}
          onCancel={vi.fn()}
          onConfirmed={vi.fn()}
          showUnderstandingPrompt
        />,
      );

      await userEventInstance.click(
        screen.getByRole("button", { name: /paste what the teacher said/i }),
      );
      await userEventInstance.click(screen.getByRole("button", { name: /^back$/i }));

      expect(
        screen.getByRole("button", { name: /paste what the teacher said/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /say it in my own words/i }),
      ).toBeInTheDocument();
    });

    it("does not show any prompt when showUnderstandingPrompt is omitted, even with empty notes", () => {
      render(
        <WorkBreakdownPage
          user={user}
          assignment={assignment}
          confirmedItems={[]}
          onCancel={vi.fn()}
          onConfirmed={vi.fn()}
        />,
      );

      expect(
        screen.queryByRole("button", { name: /paste what the teacher said/i }),
      ).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText(/questions 1–10/i)).toBeInTheDocument();
    });
  });
});
