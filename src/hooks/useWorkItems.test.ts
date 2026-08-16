import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("../services/workItemService", () => ({
  listWorkItems: vi.fn(),
  completeAllForAssignment: vi.fn(),
}));

import * as workItemService from "../services/workItemService";
import { useWorkItems } from "./useWorkItems";

const mockedService = workItemService as unknown as {
  listWorkItems: ReturnType<typeof vi.fn>;
  completeAllForAssignment: ReturnType<typeof vi.fn>;
};

const item = {
  id: "1",
  assignmentId: "a1",
  title: "Find three sources",
  effortMinutes: 20,
  completedAt: null,
  position: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useWorkItems", () => {
  it("loads work items for the assignment", async () => {
    mockedService.listWorkItems.mockResolvedValue([item]);

    const { result } = renderHook(() => useWorkItems("a1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedService.listWorkItems).toHaveBeenCalledWith("a1");
    expect(result.current.workItems).toEqual([item]);
  });

  it("refetches on demand", async () => {
    mockedService.listWorkItems.mockResolvedValue([item]);

    const { result } = renderHook(() => useWorkItems("a1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockedService.listWorkItems.mockResolvedValue([]);
    await act(() => result.current.refetch());

    expect(mockedService.listWorkItems).toHaveBeenCalledTimes(2);
    expect(result.current.workItems).toEqual([]);
  });

  it("marks every open work item complete locally", async () => {
    mockedService.listWorkItems.mockResolvedValue([
      { ...item, id: "1", completedAt: null },
      { ...item, id: "2", completedAt: "2026-03-10T00:00:00Z" },
    ]);
    mockedService.completeAllForAssignment.mockResolvedValue(undefined);

    const { result } = renderHook(() => useWorkItems("a1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.markAllComplete());

    expect(mockedService.completeAllForAssignment).toHaveBeenCalledWith("a1");
    expect(result.current.workItems.every((i) => i.completedAt !== null)).toBe(
      true,
    );
  });

  it("sets actionError when completing fails", async () => {
    mockedService.listWorkItems.mockResolvedValue([item]);
    mockedService.completeAllForAssignment.mockRejectedValue({ message: "boom" });

    const { result } = renderHook(() => useWorkItems("a1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.markAllComplete());

    expect(result.current.actionError).toBe("boom");
  });
});
