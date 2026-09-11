import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWorkItemOrchestration } from "./useWorkItemOrchestration";

vi.mock("../services/decompositionAttemptService", () => ({
  recordDecompositionAttempt: vi.fn().mockResolvedValue(undefined),
}));

import * as decompositionAttemptService from "../services/decompositionAttemptService";

const mockedDecompositionAttemptService = decompositionAttemptService as unknown as {
  recordDecompositionAttempt: ReturnType<typeof vi.fn>;
};

const assignment = {
  id: "a1",
  courseId: "c1",
  title: "Essay",
  dueDate: "2026-03-20",
  effortMinutes: 30,
  notes: null,
  completedAt: null,
};

const existingItem = { id: "w1", assignmentId: "a1", title: "Draft", effortMinutes: 30, completedAt: null, position: 0 };
const newItem = { id: "w2", assignmentId: "a1", title: "Revise", effortMinutes: 20, completedAt: null, position: 1 };

function setup() {
  const updateAssignment = vi.fn().mockResolvedValue(true);
  const addItem = vi.fn().mockResolvedValue([existingItem, newItem]);
  const editItem = vi.fn().mockResolvedValue([{ ...existingItem, title: "Draft (revised)" }]);
  const deleteItem = vi.fn().mockResolvedValue([]);

  const { result } = renderHook(() =>
    useWorkItemOrchestration({
      userId: "student-1",
      assignmentId: "a1",
      assignment,
      updateAssignment,
      addItem,
      editItem,
      deleteItem,
    }),
  );

  return { result, updateAssignment, addItem, editItem, deleteItem };
}

beforeEach(() => {
  mockedDecompositionAttemptService.recordDecompositionAttempt.mockClear();
});

describe("addStep", () => {
  it("recomputes assignment effort as the sum of the resulting items and records a DecompositionAttempt", async () => {
    const { result, updateAssignment } = setup();

    const updated = await result.current.addStep("Revise", 20, [existingItem]);

    expect(updated).toEqual([existingItem, newItem]);
    expect(updateAssignment).toHaveBeenCalledWith(
      expect.objectContaining({ effortMinutes: 50 }),
    );
    expect(mockedDecompositionAttemptService.recordDecompositionAttempt).toHaveBeenCalledWith(
      "student-1",
      expect.objectContaining({
        assignmentId: "a1",
        initialWorkItems: ["Draft"],
        resultingWorkItems: ["Draft", "Revise"],
      }),
    );
  });
});

describe("editStep", () => {
  it("recomputes effort and records a DecompositionAttempt", async () => {
    const { result, updateAssignment } = setup();

    await result.current.editStep("w1", { title: "Draft (revised)", effortMinutes: 30 }, [existingItem]);

    expect(updateAssignment).toHaveBeenCalledWith(expect.objectContaining({ effortMinutes: 30 }));
    expect(mockedDecompositionAttemptService.recordDecompositionAttempt).toHaveBeenCalledTimes(1);
  });
});

describe("deleteStep", () => {
  it("recomputes effort but does not record a DecompositionAttempt", async () => {
    const { result, updateAssignment } = setup();

    await result.current.deleteStep("w1");

    expect(updateAssignment).toHaveBeenCalledWith(expect.objectContaining({ effortMinutes: 0 }));
    expect(mockedDecompositionAttemptService.recordDecompositionAttempt).not.toHaveBeenCalled();
  });

  it("does not recompute effort when the delete itself failed", async () => {
    const updateAssignment = vi.fn().mockResolvedValue(true);
    const deleteItem = vi.fn().mockResolvedValue(null);
    const { result } = renderHook(() =>
      useWorkItemOrchestration({
        userId: "student-1",
        assignmentId: "a1",
        assignment,
        updateAssignment,
        addItem: vi.fn(),
        editItem: vi.fn(),
        deleteItem,
      }),
    );

    await result.current.deleteStep("w1");

    expect(updateAssignment).not.toHaveBeenCalled();
  });
});
