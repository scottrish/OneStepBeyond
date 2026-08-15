import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("../services/assignmentService", () => ({
  getAssignment: vi.fn(),
}));

import * as assignmentService from "../services/assignmentService";
import { useAssignment } from "./useAssignment";

const mockedService = assignmentService as unknown as {
  getAssignment: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useAssignment", () => {
  it("loads the assignment by id", async () => {
    mockedService.getAssignment.mockResolvedValue({
      id: "1",
      courseId: "course-1",
      title: "Chapter 7 problem set",
      dueDate: "2026-03-15",
      effortMinutes: 30,
      notes: null,
    });

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
});
