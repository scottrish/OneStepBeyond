import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("../services/workSessionService", () => ({
  listWorkSessionsForDate: vi.fn(),
  updateWorkSessionStatus: vi.fn(),
  updateWorkSessionPlannedMinutes: vi.fn(),
  deleteWorkSession: vi.fn(),
}));
vi.mock("../services/workItemService", () => ({
  completeWorkItem: vi.fn(),
}));

import * as workItemService from "../services/workItemService";
import * as workSessionService from "../services/workSessionService";
import { useTodayExecution } from "./useTodayExecution";

const mockedWorkSessionService = workSessionService as unknown as {
  listWorkSessionsForDate: ReturnType<typeof vi.fn>;
  updateWorkSessionStatus: ReturnType<typeof vi.fn>;
  updateWorkSessionPlannedMinutes: ReturnType<typeof vi.fn>;
  deleteWorkSession: ReturnType<typeof vi.fn>;
};
const mockedWorkItemService = workItemService as unknown as {
  completeWorkItem: ReturnType<typeof vi.fn>;
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

describe("useTodayExecution", () => {
  it("loads today's work sessions on mount", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([session]);

    const { result } = renderHook(() => useTodayExecution("student-1", "2026-03-16"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedWorkSessionService.listWorkSessionsForDate).toHaveBeenCalledWith(
      "student-1",
      "2026-03-16",
    );
    expect(result.current.sessions).toEqual([session]);
  });

  it("sets loadError when the initial fetch fails", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockRejectedValue(
      new Error("network down"),
    );

    const { result } = renderHook(() => useTodayExecution("student-1", "2026-03-16"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.loadError).toBe("network down");
  });

  it("start marks a session in_progress", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([session]);
    mockedWorkSessionService.updateWorkSessionStatus.mockResolvedValue(undefined);

    const { result } = renderHook(() => useTodayExecution("student-1", "2026-03-16"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.start("s1");
    });

    expect(succeeded).toBe(true);
    expect(mockedWorkSessionService.updateWorkSessionStatus).toHaveBeenCalledWith(
      "s1",
      "in_progress",
    );
    expect(result.current.sessions[0]?.status).toBe("in_progress");
  });

  it("complete marks both the session and its underlying Work Item done", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
      { ...session, status: "in_progress" },
    ]);
    mockedWorkSessionService.updateWorkSessionStatus.mockResolvedValue(undefined);
    mockedWorkItemService.completeWorkItem.mockResolvedValue(undefined);

    const { result } = renderHook(() => useTodayExecution("student-1", "2026-03-16"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.complete("s1"));

    expect(mockedWorkSessionService.updateWorkSessionStatus).toHaveBeenCalledWith("s1", "done");
    // Assignment Detail's Steps checklist reads the Work Item's own
    // completedAt, not the session's status — both must be marked done.
    expect(mockedWorkItemService.completeWorkItem).toHaveBeenCalledWith("w1");
    expect(result.current.sessions[0]?.status).toBe("done");
  });

  it("sets actionError if completing the Work Item fails, even when the session update succeeds", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
      { ...session, status: "in_progress" },
    ]);
    mockedWorkSessionService.updateWorkSessionStatus.mockResolvedValue(undefined);
    mockedWorkItemService.completeWorkItem.mockRejectedValue({ message: "boom" });

    const { result } = renderHook(() => useTodayExecution("student-1", "2026-03-16"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let succeeded = true;
    await act(async () => {
      succeeded = await result.current.complete("s1");
    });

    expect(succeeded).toBe(false);
    expect(result.current.actionError).toBe("boom");
  });

  it("needMoreTime adds 10 minutes to the session's planned duration", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([session]);
    mockedWorkSessionService.updateWorkSessionPlannedMinutes.mockResolvedValue(undefined);

    const { result } = renderHook(() => useTodayExecution("student-1", "2026-03-16"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.needMoreTime("s1"));

    expect(mockedWorkSessionService.updateWorkSessionPlannedMinutes).toHaveBeenCalledWith(
      "s1",
      40,
    );
    expect(result.current.sessions[0]?.plannedMinutes).toBe(40);
  });

  it("defer deletes the session and removes it locally", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([session]);
    mockedWorkSessionService.deleteWorkSession.mockResolvedValue(undefined);

    const { result } = renderHook(() => useTodayExecution("student-1", "2026-03-16"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.defer("s1"));

    expect(mockedWorkSessionService.deleteWorkSession).toHaveBeenCalledWith("s1");
    expect(result.current.sessions).toEqual([]);
  });

  it("sets actionError when an action fails", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([session]);
    mockedWorkSessionService.updateWorkSessionStatus.mockRejectedValue({ message: "boom" });

    const { result } = renderHook(() => useTodayExecution("student-1", "2026-03-16"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let succeeded = true;
    await act(async () => {
      succeeded = await result.current.start("s1");
    });

    expect(succeeded).toBe(false);
    expect(result.current.actionError).toBe("boom");
  });
});
