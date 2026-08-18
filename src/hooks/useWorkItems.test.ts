import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("../services/workItemService", () => ({
  listWorkItems: vi.fn(),
  completeAllForAssignment: vi.fn(),
  createWorkItems: vi.fn(),
  updateWorkItem: vi.fn(),
  deleteWorkItems: vi.fn(),
}));

import * as workItemService from "../services/workItemService";
import { useWorkItems } from "./useWorkItems";

const mockedService = workItemService as unknown as {
  listWorkItems: ReturnType<typeof vi.fn>;
  completeAllForAssignment: ReturnType<typeof vi.fn>;
  createWorkItems: ReturnType<typeof vi.fn>;
  updateWorkItem: ReturnType<typeof vi.fn>;
  deleteWorkItems: ReturnType<typeof vi.fn>;
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

    const { result } = renderHook(() => useWorkItems("student-1", "a1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedService.listWorkItems).toHaveBeenCalledWith("a1");
    expect(result.current.workItems).toEqual([item]);
  });

  it("refetches on demand", async () => {
    mockedService.listWorkItems.mockResolvedValue([item]);

    const { result } = renderHook(() => useWorkItems("student-1", "a1"));
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

    const { result } = renderHook(() => useWorkItems("student-1", "a1"));
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

    const { result } = renderHook(() => useWorkItems("student-1", "a1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.markAllComplete());

    expect(result.current.actionError).toBe("boom");
  });

  describe("addItem (docs/features/assignment-detail-cta-hierarchy.md item 3b)", () => {
    it("creates one item positioned after the existing ones, and returns the full updated list", async () => {
      mockedService.listWorkItems.mockResolvedValue([item]);
      const created = { id: "2", assignmentId: "a1", title: "Draft outline", effortMinutes: 30, completedAt: null, position: 1 };
      mockedService.createWorkItems.mockResolvedValue([created]);

      const { result } = renderHook(() => useWorkItems("student-1", "a1"));
      await waitFor(() => expect(result.current.loading).toBe(false));

      let returned: unknown;
      await act(async () => {
        returned = await result.current.addItem("Draft outline", 30);
      });

      expect(mockedService.createWorkItems).toHaveBeenCalledWith("student-1", [
        { assignmentId: "a1", title: "Draft outline", effortMinutes: 30, position: 1 },
      ]);
      expect(result.current.workItems).toEqual([item, created]);
      expect(returned).toEqual([item, created]);
    });

    it("positions the first item at 0 when the assignment has no existing items", async () => {
      mockedService.listWorkItems.mockResolvedValue([]);
      mockedService.createWorkItems.mockResolvedValue([
        { id: "1", assignmentId: "a1", title: "Draft outline", effortMinutes: 30, completedAt: null, position: 0 },
      ]);

      const { result } = renderHook(() => useWorkItems("student-1", "a1"));
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(() => result.current.addItem("Draft outline", 30));

      expect(mockedService.createWorkItems).toHaveBeenCalledWith("student-1", [
        { assignmentId: "a1", title: "Draft outline", effortMinutes: 30, position: 0 },
      ]);
    });

    it("sets actionError and returns null when adding fails", async () => {
      mockedService.listWorkItems.mockResolvedValue([]);
      mockedService.createWorkItems.mockRejectedValue({ message: "boom" });

      const { result } = renderHook(() => useWorkItems("student-1", "a1"));
      await waitFor(() => expect(result.current.loading).toBe(false));

      let returned: unknown;
      await act(async () => {
        returned = await result.current.addItem("Draft outline", 30);
      });

      expect(returned).toBeNull();
      expect(result.current.actionError).toBe("boom");
    });
  });

  describe("editItem (docs/features/assignment-detail-cta-hierarchy.md item 3b)", () => {
    it("updates one item's title/effort locally and returns the full updated list", async () => {
      mockedService.listWorkItems.mockResolvedValue([item]);
      mockedService.updateWorkItem.mockResolvedValue(undefined);

      const { result } = renderHook(() => useWorkItems("student-1", "a1"));
      await waitFor(() => expect(result.current.loading).toBe(false));

      let returned: unknown;
      await act(async () => {
        returned = await result.current.editItem("1", { title: "Find five sources", effortMinutes: 25 });
      });

      expect(mockedService.updateWorkItem).toHaveBeenCalledWith("1", {
        title: "Find five sources",
        effortMinutes: 25,
      });
      expect(result.current.workItems).toEqual([
        { ...item, title: "Find five sources", effortMinutes: 25 },
      ]);
      expect(returned).toEqual([{ ...item, title: "Find five sources", effortMinutes: 25 }]);
    });

    it("sets actionError and returns null when editing fails", async () => {
      mockedService.listWorkItems.mockResolvedValue([item]);
      mockedService.updateWorkItem.mockRejectedValue({ message: "boom" });

      const { result } = renderHook(() => useWorkItems("student-1", "a1"));
      await waitFor(() => expect(result.current.loading).toBe(false));

      let returned: unknown;
      await act(async () => {
        returned = await result.current.editItem("1", { title: "x", effortMinutes: 10 });
      });

      expect(returned).toBeNull();
      expect(result.current.actionError).toBe("boom");
    });
  });

  describe("deleteItem (docs/features/assignment-detail-cta-hierarchy.md item 3b)", () => {
    it("removes one item locally and returns the full updated list", async () => {
      const second = { ...item, id: "2", position: 1 };
      mockedService.listWorkItems.mockResolvedValue([item, second]);
      mockedService.deleteWorkItems.mockResolvedValue(undefined);

      const { result } = renderHook(() => useWorkItems("student-1", "a1"));
      await waitFor(() => expect(result.current.loading).toBe(false));

      let returned: unknown;
      await act(async () => {
        returned = await result.current.deleteItem("1");
      });

      expect(mockedService.deleteWorkItems).toHaveBeenCalledWith(["1"]);
      expect(result.current.workItems).toEqual([second]);
      expect(returned).toEqual([second]);
    });

    it("sets actionError and returns null when deleting fails", async () => {
      mockedService.listWorkItems.mockResolvedValue([item]);
      mockedService.deleteWorkItems.mockRejectedValue({ message: "boom" });

      const { result } = renderHook(() => useWorkItems("student-1", "a1"));
      await waitFor(() => expect(result.current.loading).toBe(false));

      let returned: unknown;
      await act(async () => {
        returned = await result.current.deleteItem("1");
      });

      expect(returned).toBeNull();
      expect(result.current.actionError).toBe("boom");
    });
  });
});
