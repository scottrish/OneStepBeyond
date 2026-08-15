import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("../services/assignmentService", () => ({
  createAssignment: vi.fn(),
}));

import * as assignmentService from "../services/assignmentService";
import { useCreateAssignment } from "./useCreateAssignment";

const mockedService = assignmentService as unknown as {
  createAssignment: ReturnType<typeof vi.fn>;
};

const input = {
  courseId: "course-1",
  title: "Chapter 7 problem set",
  dueDate: "2026-03-15",
  effortMinutes: 30,
  notes: "",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCreateAssignment", () => {
  it("returns the new assignment's id on success", async () => {
    mockedService.createAssignment.mockResolvedValue({
      id: "assignment-1",
      courseId: "course-1",
      title: "Chapter 7 problem set",
      dueDate: "2026-03-15",
      effortMinutes: 30,
      notes: null,
    });

    const { result } = renderHook(() => useCreateAssignment("student-1"));

    let id: string | null = null;
    await act(async () => {
      id = await result.current.createAssignment(input);
    });

    expect(mockedService.createAssignment).toHaveBeenCalledWith(
      "student-1",
      input,
    );
    expect(id).toBe("assignment-1");
    expect(result.current.actionError).toBeNull();
  });

  it("sets actionError and returns null on failure", async () => {
    mockedService.createAssignment.mockRejectedValue({
      message: "permission denied",
    });

    const { result } = renderHook(() => useCreateAssignment("student-1"));

    let id: string | null = "not-null";
    await act(async () => {
      id = await result.current.createAssignment(input);
    });

    expect(id).toBeNull();
    expect(result.current.actionError).toBe("permission denied");
  });

  it("tracks saving state across the call", async () => {
    let resolveCreate: (value: unknown) => void = () => {};
    mockedService.createAssignment.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );

    const { result } = renderHook(() => useCreateAssignment("student-1"));

    let savePromise: Promise<string | null>;
    act(() => {
      savePromise = result.current.createAssignment(input);
    });
    expect(result.current.saving).toBe(true);

    resolveCreate({
      id: "assignment-1",
      courseId: "course-1",
      title: "Chapter 7 problem set",
      dueDate: "2026-03-15",
      effortMinutes: 30,
      notes: null,
    });
    await act(async () => {
      await savePromise;
    });

    await waitFor(() => expect(result.current.saving).toBe(false));
  });
});
