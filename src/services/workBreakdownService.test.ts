import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./assignmentService", () => ({
  updateAssignment: vi.fn(),
}));
vi.mock("./decompositionAttemptService", () => ({
  recordDecompositionAttempt: vi.fn(),
}));
vi.mock("./workItemService", () => ({
  createWorkItems: vi.fn(),
  deleteWorkItems: vi.fn(),
}));

import * as assignmentService from "./assignmentService";
import * as decompositionAttemptService from "./decompositionAttemptService";
import * as workItemService from "./workItemService";
import { confirmWorkBreakdown } from "./workBreakdownService";

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

const assignment = {
  id: "a1",
  courseId: "course-1",
  title: "Book report",
  dueDate: "2026-03-15",
  effortMinutes: 30,
  notes: "Bring a copy of the book",
  completedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("confirmWorkBreakdown", () => {
  it("inserts the new items, derives the assignment's effort, deletes the old items, then records the attempt", async () => {
    const createdItems = [
      { id: "w1", assignmentId: "a1", title: "Finish book", effortMinutes: 60, completedAt: null, position: 0 },
      { id: "w2", assignmentId: "a1", title: "Write report", effortMinutes: 45, completedAt: null, position: 1 },
    ];
    mockedWorkItemService.createWorkItems.mockResolvedValue(createdItems);
    mockedAssignmentService.updateAssignment.mockResolvedValue(undefined);
    mockedWorkItemService.deleteWorkItems.mockResolvedValue(undefined);
    mockedDecompositionAttemptService.recordDecompositionAttempt.mockResolvedValue(undefined);

    const previousItems = [
      { id: "old-1", assignmentId: "a1", title: "Read book", effortMinutes: 90, completedAt: null, position: 0 },
    ];

    const result = await confirmWorkBreakdown(
      "student-1",
      assignment,
      previousItems,
      [
        { title: "Finish book", effortMinutes: 60 },
        { title: "Write report", effortMinutes: 45 },
      ],
      3,
    );

    expect(mockedWorkItemService.createWorkItems).toHaveBeenCalledWith("student-1", [
      { assignmentId: "a1", title: "Finish book", effortMinutes: 60, position: 0 },
      { assignmentId: "a1", title: "Write report", effortMinutes: 45, position: 1 },
    ]);
    expect(mockedAssignmentService.updateAssignment).toHaveBeenCalledWith("a1", {
      title: "Book report",
      dueDate: "2026-03-15",
      notes: "Bring a copy of the book",
      effortMinutes: 105,
    });
    expect(mockedWorkItemService.deleteWorkItems).toHaveBeenCalledWith(["old-1"]);
    expect(mockedDecompositionAttemptService.recordDecompositionAttempt).toHaveBeenCalledWith(
      "student-1",
      {
        assignmentId: "a1",
        initialWorkItems: ["Read book"],
        resultingWorkItems: ["Finish book", "Write report"],
        revisionCount: 3,
        outcome: "confirmed",
      },
    );
    expect(result).toEqual(createdItems);

    // Insert happens before delete — see
    // docs/decisions/20260815-manual-work-breakdown-draft-state.md.
    const createOrder = mockedWorkItemService.createWorkItems.mock.invocationCallOrder[0];
    const deleteOrder = mockedWorkItemService.deleteWorkItems.mock.invocationCallOrder[0];
    expect(createOrder).toBeLessThan(deleteOrder);
  });

  it("does not call deleteWorkItems when there were no previous items", async () => {
    mockedWorkItemService.createWorkItems.mockResolvedValue([]);
    mockedAssignmentService.updateAssignment.mockResolvedValue(undefined);
    mockedDecompositionAttemptService.recordDecompositionAttempt.mockResolvedValue(undefined);

    await confirmWorkBreakdown(
      "student-1",
      assignment,
      [],
      [{ title: "Questions 1-10", effortMinutes: 20 }],
      1,
    );

    expect(mockedWorkItemService.deleteWorkItems).not.toHaveBeenCalled();
  });
});
