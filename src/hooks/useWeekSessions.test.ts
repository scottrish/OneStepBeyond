import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("../services/workSessionService", () => ({
  listWorkSessionsForStudent: vi.fn(),
  deleteWorkSession: vi.fn(),
}));

import * as workSessionService from "../services/workSessionService";
import { useWeekSessions } from "./useWeekSessions";

const mockedService = workSessionService as unknown as {
  listWorkSessionsForStudent: ReturnType<typeof vi.fn>;
  deleteWorkSession: ReturnType<typeof vi.fn>;
};

const session = {
  id: "s1",
  workItemId: "w1",
  date: "2026-03-16",
  plannedMinutes: 30,
  startTime: "16:00",
  status: "planned" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useWeekSessions", () => {
  it("loads every session for the student on mount, across all dates", async () => {
    mockedService.listWorkSessionsForStudent.mockResolvedValue([session]);

    const { result } = renderHook(() => useWeekSessions("student-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedService.listWorkSessionsForStudent).toHaveBeenCalledWith("student-1");
    expect(result.current.sessions).toEqual([session]);
  });

  it("sets loadError when the initial fetch fails", async () => {
    mockedService.listWorkSessionsForStudent.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useWeekSessions("student-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.loadError).toBe("network down");
  });

  it("retry clears loadError and refetches", async () => {
    mockedService.listWorkSessionsForStudent.mockRejectedValueOnce(new Error("network down"));
    const { result } = renderHook(() => useWeekSessions("student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.loadError).toBe("network down");

    mockedService.listWorkSessionsForStudent.mockResolvedValue([session]);
    act(() => result.current.retry());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.loadError).toBeNull();
    expect(result.current.sessions).toEqual([session]);
  });

  it("removes a session locally after the service call succeeds", async () => {
    mockedService.listWorkSessionsForStudent.mockResolvedValue([session]);
    mockedService.deleteWorkSession.mockResolvedValue(undefined);

    const { result } = renderHook(() => useWeekSessions("student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.removeSession("s1");
    });

    expect(succeeded).toBe(true);
    expect(mockedService.deleteWorkSession).toHaveBeenCalledWith("s1");
    expect(result.current.sessions).toEqual([]);
  });

  it("sets actionError and keeps state unchanged when removing fails", async () => {
    mockedService.listWorkSessionsForStudent.mockResolvedValue([session]);
    mockedService.deleteWorkSession.mockRejectedValue({ message: "boom" });

    const { result } = renderHook(() => useWeekSessions("student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.removeSession("s1");
    });

    expect(result.current.actionError).toBe("boom");
    expect(result.current.sessions).toEqual([session]);
  });
});
