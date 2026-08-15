import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("../services/workItemService", () => ({
  listWorkItems: vi.fn(),
  createWorkItem: vi.fn(),
  completeAllForAssignment: vi.fn(),
}));

import * as workItemService from "../services/workItemService";
import { useWorkItems } from "./useWorkItems";

const mockedService = workItemService as unknown as {
  listWorkItems: ReturnType<typeof vi.fn>;
  createWorkItem: ReturnType<typeof vi.fn>;
  completeAllForAssignment: ReturnType<typeof vi.fn>;
};

const item = {
  id: "1",
  assignmentId: "a1",
  title: "Find three sources",
  effortMinutes: 20,
  completedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useWorkItems", () => {
  it("loads work items for the assignment", async () => {
    mockedService.listWorkItems.mockResolvedValue([item]);

    const { result } = renderHook(() => useWorkItems("a1", "student-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedService.listWorkItems).toHaveBeenCalledWith("a1");
    expect(result.current.workItems).toEqual([item]);
  });

  it("adds a work item and appends it locally", async () => {
    mockedService.listWorkItems.mockResolvedValue([]);
    mockedService.createWorkItem.mockResolvedValue(item);

    const { result } = renderHook(() => useWorkItems("a1", "student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.addWorkItem("Find three sources", 20));

    expect(mockedService.createWorkItem).toHaveBeenCalledWith("student-1", {
      assignmentId: "a1",
      title: "Find three sources",
      effortMinutes: 20,
    });
    expect(result.current.workItems).toEqual([item]);
  });

  it("marks every open work item complete locally", async () => {
    mockedService.listWorkItems.mockResolvedValue([
      { ...item, id: "1", completedAt: null },
      { ...item, id: "2", completedAt: "2026-03-10T00:00:00Z" },
    ]);
    mockedService.completeAllForAssignment.mockResolvedValue(undefined);

    const { result } = renderHook(() => useWorkItems("a1", "student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.markAllComplete());

    expect(mockedService.completeAllForAssignment).toHaveBeenCalledWith("a1");
    expect(result.current.workItems.every((i) => i.completedAt !== null)).toBe(
      true,
    );
  });

  it("sets actionError when adding fails", async () => {
    mockedService.listWorkItems.mockResolvedValue([]);
    mockedService.createWorkItem.mockRejectedValue({ message: "boom" });

    const { result } = renderHook(() => useWorkItems("a1", "student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.addWorkItem("Find three sources", 20));

    expect(result.current.actionError).toBe("boom");
  });
});
