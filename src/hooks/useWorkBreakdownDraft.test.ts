import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

vi.mock("../services/workBreakdownService", () => ({
  confirmWorkBreakdown: vi.fn(),
}));

import * as workBreakdownService from "../services/workBreakdownService";
import { useWorkBreakdownDraft } from "./useWorkBreakdownDraft";

const mockedService = workBreakdownService as unknown as {
  confirmWorkBreakdown: ReturnType<typeof vi.fn>;
};

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

describe("useWorkBreakdownDraft", () => {
  it("starts empty for a first-time breakdown", () => {
    const { result } = renderHook(() => useWorkBreakdownDraft("student-1", assignment, []));

    expect(result.current.draftItems).toEqual([]);
  });

  it("seeds the draft from existing confirmed items when editing", () => {
    const confirmedItems = [
      { id: "w1", assignmentId: "a1", title: "Finish book", effortMinutes: 60, completedAt: null, position: 0 },
    ];

    const { result } = renderHook(() =>
      useWorkBreakdownDraft("student-1", assignment, confirmedItems),
    );

    expect(result.current.draftItems).toEqual([
      { key: "w1", title: "Finish book", effortMinutes: 60 },
    ]);
  });

  it("excludes completed items from the editable draft, and exposes them separately", () => {
    // docs/features/work-breakdown-revision-preserves-completed-items.md —
    // completed items can't be renamed, estimated, reordered, or deleted
    // through this flow, so they never enter draftItems in the first place.
    const doneItem = {
      id: "w1",
      assignmentId: "a1",
      title: "Read book",
      effortMinutes: 90,
      completedAt: "2026-03-14T00:00:00Z",
      position: 0,
    };
    const openItem = {
      id: "w2",
      assignmentId: "a1",
      title: "Write report",
      effortMinutes: 45,
      completedAt: null,
      position: 1,
    };

    const { result } = renderHook(() =>
      useWorkBreakdownDraft("student-1", assignment, [doneItem, openItem]),
    );

    expect(result.current.draftItems).toEqual([
      { key: "w2", title: "Write report", effortMinutes: 45 },
    ]);
    expect(result.current.completedItems).toEqual([doneItem]);
  });

  it("adds, edits, estimates, reorders, and deletes items locally with no service calls", () => {
    const { result } = renderHook(() => useWorkBreakdownDraft("student-1", assignment, []));

    act(() => result.current.addItem("Finish book"));
    act(() => result.current.addItem("Write report"));
    expect(result.current.draftItems.map((i) => i.title)).toEqual([
      "Finish book",
      "Write report",
    ]);

    const firstKey = result.current.draftItems[0].key;
    act(() => result.current.editItem(firstKey, "Finish reading the book"));
    expect(result.current.draftItems[0].title).toBe("Finish reading the book");

    act(() => result.current.setEstimate(firstKey, 60));
    expect(result.current.draftItems[0].effortMinutes).toBe(60);

    act(() => result.current.moveDraftItem(0, "down"));
    expect(result.current.draftItems.map((i) => i.title)).toEqual([
      "Write report",
      "Finish reading the book",
    ]);

    const secondKey = result.current.draftItems[1].key;
    act(() => result.current.deleteItem(secondKey));
    expect(result.current.draftItems.map((i) => i.title)).toEqual(["Write report"]);

    expect(mockedService.confirmWorkBreakdown).not.toHaveBeenCalled();
  });

  it("tracks a revision count across edits", () => {
    const { result } = renderHook(() => useWorkBreakdownDraft("student-1", assignment, []));

    act(() => result.current.addItem("Finish book"));
    act(() => result.current.addItem("Write report"));
    act(() => result.current.deleteItem(result.current.draftItems[0].key));

    // Not directly exposed, but confirm() passes it through — verified in
    // the confirm() test below.
    expect(result.current.draftItems).toHaveLength(1);
  });

  it("confirm() calls confirmWorkBreakdown with the current draft and revision count", async () => {
    const created = [
      { id: "w1", assignmentId: "a1", title: "Finish book", effortMinutes: 60, completedAt: null, position: 0 },
    ];
    mockedService.confirmWorkBreakdown.mockResolvedValue(created);

    const { result } = renderHook(() => useWorkBreakdownDraft("student-1", assignment, []));

    act(() => result.current.addItem("Finish book"));
    act(() => result.current.setEstimate(result.current.draftItems[0].key, 60));

    let confirmed: unknown;
    await act(async () => {
      confirmed = await result.current.confirm();
    });

    expect(mockedService.confirmWorkBreakdown).toHaveBeenCalledWith(
      "student-1",
      assignment,
      [],
      [{ title: "Finish book", effortMinutes: 60 }],
      2,
    );
    expect(confirmed).toEqual(created);
  });

  it("sets actionError when confirm() fails", async () => {
    mockedService.confirmWorkBreakdown.mockRejectedValue({ message: "boom" });

    const { result } = renderHook(() => useWorkBreakdownDraft("student-1", assignment, []));
    act(() => result.current.addItem("Finish book"));

    let confirmed: unknown;
    await act(async () => {
      confirmed = await result.current.confirm();
    });

    expect(confirmed).toBeNull();
    expect(result.current.actionError).toBe("boom");
  });
});
