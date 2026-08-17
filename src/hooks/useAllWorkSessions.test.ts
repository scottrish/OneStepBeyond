import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

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
  it("starts loading, and stops once the fetch resolves", async () => {
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
    expect(result.current.loading).toBe(true);

    await waitFor(() =>
      expect(mockedService.listWorkSessionsForStudent).toHaveBeenCalledWith("student-1"),
    );
    await waitFor(() => expect(result.current.sessions).toEqual(sessions));
    expect(result.current.loading).toBe(false);
  });

  it("stops loading (without throwing) when the fetch fails", async () => {
    mockedService.listWorkSessionsForStudent.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useAllWorkSessions("student-1"));

    await waitFor(() =>
      expect(mockedService.listWorkSessionsForStudent).toHaveBeenCalledWith("student-1"),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.sessions).toEqual([]);
  });

  // docs/playwright/daily-planning/iteration-03/findings.yaml FINDING-DP-003
  it("refetch() re-fetches, so a session created after mount is picked up without remounting", async () => {
    mockedService.listWorkSessionsForStudent.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useAllWorkSessions("student-1"));

    await waitFor(() =>
      expect(mockedService.listWorkSessionsForStudent).toHaveBeenCalledTimes(1),
    );
    expect(result.current.sessions).toEqual([]);

    const newSession = {
      id: "1",
      workItemId: "w1",
      date: "2026-03-16",
      plannedMinutes: 30,
      startTime: null,
      status: "planned" as const,
    };
    mockedService.listWorkSessionsForStudent.mockResolvedValueOnce([newSession]);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() =>
      expect(mockedService.listWorkSessionsForStudent).toHaveBeenCalledTimes(2),
    );
    await waitFor(() => expect(result.current.sessions).toEqual([newSession]));
  });
});
