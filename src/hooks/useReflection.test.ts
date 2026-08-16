import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

vi.mock("../services/reflectionService", () => ({
  recordReflection: vi.fn(),
}));

import * as reflectionService from "../services/reflectionService";
import { useReflection } from "./useReflection";

const mockedService = reflectionService as unknown as {
  recordReflection: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useReflection", () => {
  it("submits a reflection and returns true on success", async () => {
    mockedService.recordReflection.mockResolvedValue(undefined);

    const { result } = renderHook(() => useReflection("student-1"));

    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.submitReflection({
        assignmentId: "a1",
        trigger: "assignment_completed",
        structuredResponse: "I missed a step",
        freeText: null,
        proposedAdjustment: "Add a step I missed",
      });
    });

    expect(succeeded).toBe(true);
    expect(mockedService.recordReflection).toHaveBeenCalledWith("student-1", {
      assignmentId: "a1",
      trigger: "assignment_completed",
      structuredResponse: "I missed a step",
      freeText: null,
      proposedAdjustment: "Add a step I missed",
    });
  });

  it("sets actionError and returns false on failure", async () => {
    mockedService.recordReflection.mockRejectedValue({ message: "boom" });

    const { result } = renderHook(() => useReflection("student-1"));

    let succeeded = true;
    await act(async () => {
      succeeded = await result.current.submitReflection({
        assignmentId: "a1",
        trigger: "assignment_completed",
        structuredResponse: "Not sure",
        freeText: null,
        proposedAdjustment: null,
      });
    });

    expect(succeeded).toBe(false);
    expect(result.current.actionError).toBe("boom");
  });
});
