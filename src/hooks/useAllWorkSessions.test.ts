import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("../services/workSessionService", () => ({
  listWorkSessionsForStudent: vi.fn(),
}));

import * as workSessionService from "../services/workSessionService";
import { useAllWorkSessions } from "./useAllWorkSessions";

const mockedService = workSessionService as unknown as {
  listWorkSessionsForStudent: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useAllWorkSessions", () => {
  it("returns every session the service resolves with, across all dates", async () => {
    const sessions = [
      {
        id: "1",
        workItemId: "w1",
        date: "2026-03-16",
        plannedMinutes: 30,
        startTime: null,
        status: "planned" as const,
      },
      {
        id: "2",
        workItemId: "w2",
        date: "2026-03-20",
        plannedMinutes: 45,
        startTime: "16:00",
        status: "planned" as const,
      },
    ];
    mockedService.listWorkSessionsForStudent.mockResolvedValue(sessions);

    const { result } = renderHook(() => useAllWorkSessions("student-1"));

    await waitFor(() =>
      expect(mockedService.listWorkSessionsForStudent).toHaveBeenCalledWith("student-1"),
    );
    await waitFor(() => expect(result.current).toEqual(sessions));
  });

  it("returns an empty array (rather than throwing) when the fetch fails", async () => {
    mockedService.listWorkSessionsForStudent.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useAllWorkSessions("student-1"));

    await waitFor(() =>
      expect(mockedService.listWorkSessionsForStudent).toHaveBeenCalledWith("student-1"),
    );
    expect(result.current).toEqual([]);
  });
});
