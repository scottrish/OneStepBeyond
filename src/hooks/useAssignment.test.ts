import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("../services/assignmentService", () => ({
  getAssignment: vi.fn(),
  updateAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
  completeAssignment: vi.fn(),
}));

import * as assignmentService from "../services/assignmentService";
import { useAssignment } from "./useAssignment";

const mockedService = assignmentService as unknown as {
  getAssignment: ReturnType<typeof vi.fn>;
  updateAssignment: ReturnType<typeof vi.fn>;
  deleteAssignment: ReturnType<typeof vi.fn>;
  completeAssignment: ReturnType<typeof vi.fn>;
};

const assignment = {
  id: "1",
  courseId: "course-1",
  title: "Chapter 7 problem set",
  dueDate: "2026-03-15",
  effortMinutes: 30,
  notes: null,
  completedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useAssignment", () => {
  it("loads the assignment by id", async () => {
    mockedService.getAssignment.mockResolvedValue(assignment);

    const { result } = renderHook(() => useAssignment("1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedService.getAssignment).toHaveBeenCalledWith("1");
    expect(result.current.assignment?.title).toBe("Chapter 7 problem set");
    expect(result.current.loadError).toBeNull();
  });

  it("sets loadError when the fetch fails", async () => {
    mockedService.getAssignment.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useAssignment("1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.loadError).toBe("network down");
    expect(result.current.assignment).toBeNull();
  });

  it("updates the assignment locally after a successful edit", async () => {
    mockedService.getAssignment.mockResolvedValue(assignment);
    mockedService.updateAssignment.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAssignment("1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.updateAssignment({
        title: "Chapter 8 problem set",
        dueDate: "2026-03-20",
        effortMinutes: 45,
        notes: "",
      });
    });

    expect(succeeded).toBe(true);
    expect(result.current.assignment).toMatchObject({
      title: "Chapter 8 problem set",
      dueDate: "2026-03-20",
      effortMinutes: 45,
      notes: null,
    });
  });

  it("sets actionError when an edit fails", async () => {
    mockedService.getAssignment.mockResolvedValue(assignment);
    mockedService.updateAssignment.mockRejectedValue({ message: "boom" });

    const { result } = renderHook(() => useAssignment("1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateAssignment({
        title: "Chapter 8 problem set",
        dueDate: "2026-03-20",
        effortMinutes: 45,
        notes: "",
      });
    });

    expect(result.current.actionError).toBe("boom");
  });

  it("marks the assignment complete locally after success", async () => {
    mockedService.getAssignment.mockResolvedValue(assignment);
    mockedService.completeAssignment.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAssignment("1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.completeAssignment();
    });

    expect(result.current.assignment?.completedAt).not.toBeNull();
  });

  it("returns true from deleteAssignment on success", async () => {
    mockedService.getAssignment.mockResolvedValue(assignment);
    mockedService.deleteAssignment.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAssignment("1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.deleteAssignment();
    });

    expect(succeeded).toBe(true);
    expect(mockedService.deleteAssignment).toHaveBeenCalledWith("1");
  });
});
