import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("../services/assignmentService", () => ({
  listAssignments: vi.fn(),
  updateAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
}));

vi.mock("../services/workItemService", () => ({
  listWorkItemsForStudent: vi.fn(),
}));

import * as assignmentService from "../services/assignmentService";
import * as workItemService from "../services/workItemService";
import { useAssignmentsList } from "./useAssignmentsList";

const mockedAssignmentService = assignmentService as unknown as {
  listAssignments: ReturnType<typeof vi.fn>;
  updateAssignment: ReturnType<typeof vi.fn>;
  deleteAssignment: ReturnType<typeof vi.fn>;
};
const mockedWorkItemService = workItemService as unknown as {
  listWorkItemsForStudent: ReturnType<typeof vi.fn>;
};

const assignment = {
  id: "a1",
  courseId: "course-1",
  title: "Chapter 7 problem set",
  dueDate: "2026-03-15",
  effortMinutes: 30,
  notes: null,
  completedAt: null,
};

const item = {
  id: "w1",
  assignmentId: "a1",
  title: "Find three sources",
  effortMinutes: 20,
  completedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useAssignmentsList", () => {
  it("loads assignments and work items together", async () => {
    mockedAssignmentService.listAssignments.mockResolvedValue([assignment]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([item]);

    const { result } = renderHook(() => useAssignmentsList("student-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.assignments).toEqual([assignment]);
    expect(result.current.workItems).toEqual([item]);
  });

  it("sets loadError when either fetch fails", async () => {
    mockedAssignmentService.listAssignments.mockRejectedValue(
      new Error("network down"),
    );
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([]);

    const { result } = renderHook(() => useAssignmentsList("student-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.loadError).toBe("network down");
  });

  it("edits an assignment locally after success", async () => {
    mockedAssignmentService.listAssignments.mockResolvedValue([assignment]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([]);
    mockedAssignmentService.updateAssignment.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAssignmentsList("student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() =>
      result.current.editAssignment("a1", {
        title: "Chapter 8 problem set",
        dueDate: "2026-03-20",
        effortMinutes: 45,
        notes: "",
      }),
    );

    expect(result.current.assignments[0]).toMatchObject({
      title: "Chapter 8 problem set",
      dueDate: "2026-03-20",
      effortMinutes: 45,
    });
  });

  it("removes an assignment and its work items locally after success", async () => {
    mockedAssignmentService.listAssignments.mockResolvedValue([assignment]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([item]);
    mockedAssignmentService.deleteAssignment.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAssignmentsList("student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.removeAssignment("a1"));

    expect(result.current.assignments).toEqual([]);
    expect(result.current.workItems).toEqual([]);
  });

  it("sets actionError when removing fails", async () => {
    mockedAssignmentService.listAssignments.mockResolvedValue([assignment]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([]);
    mockedAssignmentService.deleteAssignment.mockRejectedValue({
      message: "boom",
    });

    const { result } = renderHook(() => useAssignmentsList("student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.removeAssignment("a1"));

    expect(result.current.actionError).toBe("boom");
  });
});
