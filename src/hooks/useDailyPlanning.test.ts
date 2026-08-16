import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("../services/workSessionService", () => ({
  listWorkSessionsForDate: vi.fn(),
  createWorkSessions: vi.fn(),
  deletePlannedSessionsForDate: vi.fn(),
  deleteWorkSession: vi.fn(),
}));

vi.mock("../services/planningSessionService", () => ({
  recordPlanningSession: vi.fn(),
}));

import * as planningSessionService from "../services/planningSessionService";
import * as workSessionService from "../services/workSessionService";
import { useDailyPlanning } from "./useDailyPlanning";

const mockedWorkSessionService = workSessionService as unknown as {
  listWorkSessionsForDate: ReturnType<typeof vi.fn>;
  createWorkSessions: ReturnType<typeof vi.fn>;
  deletePlannedSessionsForDate: ReturnType<typeof vi.fn>;
  deleteWorkSession: ReturnType<typeof vi.fn>;
};
const mockedPlanningSessionService = planningSessionService as unknown as {
  recordPlanningSession: ReturnType<typeof vi.fn>;
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

describe("useDailyPlanning", () => {
  it("loads work sessions for the given date on mount", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([session]);

    const { result } = renderHook(() => useDailyPlanning("student-1", "2026-03-16"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedWorkSessionService.listWorkSessionsForDate).toHaveBeenCalledWith(
      "student-1",
      "2026-03-16",
    );
    expect(result.current.workSessions).toEqual([session]);
  });

  it("sets loadError when the initial fetch fails", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockRejectedValue(
      new Error("network down"),
    );

    const { result } = renderHook(() => useDailyPlanning("student-1", "2026-03-16"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.loadError).toBe("network down");
  });

  it("confirmPlan deletes old planned sessions before inserting the new set, then records a planning session", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([]);
    mockedWorkSessionService.deletePlannedSessionsForDate.mockResolvedValue(undefined);
    mockedWorkSessionService.createWorkSessions.mockResolvedValue([session]);
    mockedPlanningSessionService.recordPlanningSession.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDailyPlanning("student-1", "2026-03-16"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const callOrder: string[] = [];
    mockedWorkSessionService.deletePlannedSessionsForDate.mockImplementation(async () => {
      callOrder.push("delete");
    });
    mockedWorkSessionService.createWorkSessions.mockImplementation(async () => {
      callOrder.push("insert");
      return [session];
    });
    mockedPlanningSessionService.recordPlanningSession.mockImplementation(async () => {
      callOrder.push("record");
    });

    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.confirmPlan([
        { workItemId: "w1", plannedMinutes: 30, startTime: "16:00" },
      ]);
    });

    expect(succeeded).toBe(true);
    expect(callOrder).toEqual(["delete", "insert", "record"]);
    expect(mockedWorkSessionService.deletePlannedSessionsForDate).toHaveBeenCalledWith(
      "student-1",
      "2026-03-16",
    );
    expect(mockedWorkSessionService.createWorkSessions).toHaveBeenCalledWith("student-1", [
      { workItemId: "w1", date: "2026-03-16", plannedMinutes: 30, startTime: "16:00" },
    ]);
    expect(mockedPlanningSessionService.recordPlanningSession).toHaveBeenCalledWith(
      "student-1",
      { date: "2026-03-16", itemsPlanned: 1, minutesPlanned: 30 },
    );
    expect(result.current.workSessions).toEqual([session]);
  });

  it("confirmPlan sets actionError and refetches when a write fails", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([]);
    mockedWorkSessionService.deletePlannedSessionsForDate.mockResolvedValue(undefined);
    mockedWorkSessionService.createWorkSessions.mockRejectedValue({ message: "boom" });

    const { result } = renderHook(() => useDailyPlanning("student-1", "2026-03-16"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let succeeded = true;
    await act(async () => {
      succeeded = await result.current.confirmPlan([
        { workItemId: "w1", plannedMinutes: 30, startTime: null },
      ]);
    });

    expect(succeeded).toBe(false);
    expect(result.current.actionError).toBe("boom");
    // Refetches to reconcile local state with the server.
    expect(mockedWorkSessionService.listWorkSessionsForDate).toHaveBeenCalledTimes(2);
  });

  it("removeSession deletes and removes the session locally", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([session]);
    mockedWorkSessionService.deleteWorkSession.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDailyPlanning("student-1", "2026-03-16"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.removeSession("s1"));

    expect(mockedWorkSessionService.deleteWorkSession).toHaveBeenCalledWith("s1");
    expect(result.current.workSessions).toEqual([]);
  });
});
