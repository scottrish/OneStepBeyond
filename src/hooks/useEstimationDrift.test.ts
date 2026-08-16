import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("../services/workSessionService", () => ({
  listWorkSessionsForStudent: vi.fn(),
}));

import * as workSessionService from "../services/workSessionService";
import { useEstimationDrift } from "./useEstimationDrift";

const mockedService = workSessionService as unknown as {
  listWorkSessionsForStudent: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useEstimationDrift", () => {
  it("returns null while there is insufficient done-session history", async () => {
    mockedService.listWorkSessionsForStudent.mockResolvedValue([
      { id: "1", workItemId: "w1", date: "2026-03-16", plannedMinutes: 30, startTime: null, status: "planned" },
    ]);

    const { result } = renderHook(() => useEstimationDrift("student-1"));

    await waitFor(() =>
      expect(mockedService.listWorkSessionsForStudent).toHaveBeenCalledWith("student-1"),
    );
    expect(result.current).toBeNull();
  });

  it("returns null (rather than throwing) when the fetch fails", async () => {
    mockedService.listWorkSessionsForStudent.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useEstimationDrift("student-1"));

    await waitFor(() =>
      expect(mockedService.listWorkSessionsForStudent).toHaveBeenCalledWith("student-1"),
    );
    expect(result.current).toBeNull();
  });
});
