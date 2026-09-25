import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("../services/workSessionService", () => ({
  listWorkSessionsForDate: vi.fn(),
  createWorkSessions: vi.fn(),
  deleteWorkSession: vi.fn(),
  updateWorkSessionStartTimes: vi.fn(),
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
  deleteWorkSession: ReturnType<typeof vi.fn>;
  updateWorkSessionStartTimes: ReturnType<typeof vi.fn>;
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

  // docs/decisions/20260925-confirm-plan-appends.md
  it("confirmPlan appends: inserts the new items, records a planning session, and never deletes the day's existing plan", async () => {
    const existing = { ...session, id: "existing-1", workItemId: "w0", startTime: "15:15" };
    const added = { ...session, id: "added-1" };
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([existing]);

    const { result } = renderHook(() => useDailyPlanning("student-1", "2026-03-16"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const callOrder: string[] = [];
    mockedWorkSessionService.createWorkSessions.mockImplementation(async () => {
      callOrder.push("insert");
      return [added];
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
    expect(callOrder).toEqual(["insert", "record"]);
    expect(mockedWorkSessionService.deleteWorkSession).not.toHaveBeenCalled();
    expect(mockedWorkSessionService.createWorkSessions).toHaveBeenCalledWith("student-1", [
      { workItemId: "w1", date: "2026-03-16", plannedMinutes: 30, startTime: "16:00" },
    ]);
    // An event of what this confirm added — not a snapshot of the day.
    expect(mockedPlanningSessionService.recordPlanningSession).toHaveBeenCalledWith(
      "student-1",
      { date: "2026-03-16", itemsPlanned: 1, minutesPlanned: 30 },
    );
    expect(result.current.workSessions).toEqual([existing, added]);
  });

  it("confirmPlan sets actionError and refetches when a write fails", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([]);
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

  it("retimeSessions shows the new times immediately and saves them", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([session]);
    mockedWorkSessionService.updateWorkSessionStartTimes.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDailyPlanning("student-1", "2026-03-16"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.retimeSessions([{ id: "s1", startTime: "17:00" }]);
    });

    expect(succeeded).toBe(true);
    expect(mockedWorkSessionService.updateWorkSessionStartTimes).toHaveBeenCalledWith([
      { id: "s1", startTime: "17:00" },
    ]);
    expect(result.current.workSessions).toEqual([{ ...session, startTime: "17:00" }]);
  });

  it("retimeSessions reports the error and reloads from the server when saving fails", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([session]);
    mockedWorkSessionService.updateWorkSessionStartTimes.mockRejectedValue({ message: "boom" });

    const { result } = renderHook(() => useDailyPlanning("student-1", "2026-03-16"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.retimeSessions([{ id: "s1", startTime: "17:00" }]);
    });

    expect(result.current.actionError).toBe("boom");
    await waitFor(() => expect(result.current.workSessions).toEqual([session]));
    expect(mockedWorkSessionService.listWorkSessionsForDate).toHaveBeenCalledTimes(2);
  });
});
