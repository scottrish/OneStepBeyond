import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("../services/workSessionService", () => ({
  listWorkSessionsForDate: vi.fn(),
  startWorkSession: vi.fn(),
  completeWorkSession: vi.fn(),
  reviseWorkSessionEstimate: vi.fn(),
  rescheduleWorkSession: vi.fn(),
  clearWorkSession: vi.fn(),
}));
vi.mock("../services/workItemService", () => ({
  completeWorkItem: vi.fn(),
}));

import * as workItemService from "../services/workItemService";
import * as workSessionService from "../services/workSessionService";
import { useTodayExecution } from "./useTodayExecution";

const mockedWorkSessionService = workSessionService as unknown as {
  listWorkSessionsForDate: ReturnType<typeof vi.fn>;
  startWorkSession: ReturnType<typeof vi.fn>;
  completeWorkSession: ReturnType<typeof vi.fn>;
  reviseWorkSessionEstimate: ReturnType<typeof vi.fn>;
  rescheduleWorkSession: ReturnType<typeof vi.fn>;
  clearWorkSession: ReturnType<typeof vi.fn>;
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

  it("start marks a session in_progress and keeps when it started", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([session]);
    mockedWorkSessionService.startWorkSession.mockResolvedValue("2026-03-16T16:02:00.000Z");

    const { result } = renderHook(() => useTodayExecution("student-1", "2026-03-16"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.start("s1");
    });

    expect(succeeded).toBe(true);
    expect(mockedWorkSessionService.startWorkSession).toHaveBeenCalledWith("s1");
    expect(result.current.sessions[0]?.status).toBe("in_progress");
    expect(result.current.sessions[0]?.startedAt).toBe("2026-03-16T16:02:00.000Z");
  });

  it("complete marks both the session and its underlying Work Item done", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
      { ...session, status: "in_progress" },
    ]);
    mockedWorkSessionService.completeWorkSession.mockResolvedValue("2026-03-16T16:40:00.000Z");
    mockedWorkItemService.completeWorkItem.mockResolvedValue(undefined);

    const { result } = renderHook(() => useTodayExecution("student-1", "2026-03-16"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.complete("s1"));

    expect(mockedWorkSessionService.completeWorkSession).toHaveBeenCalledWith("s1");
    expect(result.current.sessions[0]?.completedAt).toBe("2026-03-16T16:40:00.000Z");
    // Assignment Detail's Steps checklist reads the Work Item's own
    // completedAt, not the session's status — both must be marked done.
    expect(mockedWorkItemService.completeWorkItem).toHaveBeenCalledWith("w1");
    expect(result.current.sessions[0]?.status).toBe("done");
  });

  it("sets actionError if completing the Work Item fails, even when the session update succeeds", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([
      { ...session, status: "in_progress" },
    ]);
    mockedWorkSessionService.completeWorkSession.mockResolvedValue("2026-03-16T16:40:00.000Z");
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

  it("needMoreTime adds 10 minutes and keeps the original estimate", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([session]);
    mockedWorkSessionService.reviseWorkSessionEstimate.mockResolvedValue(undefined);

    const { result } = renderHook(() => useTodayExecution("student-1", "2026-03-16"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.needMoreTime("s1"));

    expect(mockedWorkSessionService.reviseWorkSessionEstimate).toHaveBeenCalledWith("s1", 40, 30);
    expect(result.current.sessions[0]?.plannedMinutes).toBe(40);
    expect(result.current.sessions[0]?.originalPlannedMinutes).toBe(30);

    // A second revision keeps the first original.
    await act(() => result.current.needMoreTime("s1"));
    expect(mockedWorkSessionService.reviseWorkSessionEstimate).toHaveBeenLastCalledWith("s1", 50, 30);
  });

  it("complete can leave the step open ('Not yet — keep the rest of the plan')", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([{ ...session, status: "in_progress" }]);
    mockedWorkSessionService.completeWorkSession.mockResolvedValue("2026-03-16T16:40:00.000Z");

    const { result } = renderHook(() => useTodayExecution("student-1", "2026-03-16"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.complete("s1", { closeStep: false }));

    expect(mockedWorkSessionService.completeWorkSession).toHaveBeenCalledWith("s1");
    expect(mockedWorkItemService.completeWorkItem).not.toHaveBeenCalled();
  });

  it("complete can clear the step's other sessions ('Yes — clear the other time')", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([{ ...session, status: "in_progress" }]);
    mockedWorkSessionService.completeWorkSession.mockResolvedValue("2026-03-16T16:40:00.000Z");
    mockedWorkItemService.completeWorkItem.mockResolvedValue(undefined);
    mockedWorkSessionService.clearWorkSession.mockResolvedValue(undefined);

    const { result } = renderHook(() => useTodayExecution("student-1", "2026-03-16"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.complete("s1", { clearSessionIds: ["s2", "s3"] }));

    expect(mockedWorkItemService.completeWorkItem).toHaveBeenCalledWith("w1");
    expect(mockedWorkSessionService.clearWorkSession).toHaveBeenCalledWith("s2");
    expect(mockedWorkSessionService.clearWorkSession).toHaveBeenCalledWith("s3");
  });

  it("reschedule to another day moves the session and drops it from today's list", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([{ ...session, status: "in_progress" }]);
    mockedWorkSessionService.rescheduleWorkSession.mockResolvedValue(undefined);

    const { result } = renderHook(() => useTodayExecution("student-1", "2026-03-16"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.reschedule("s1", "2026-03-17", null));

    expect(mockedWorkSessionService.rescheduleWorkSession).toHaveBeenCalledWith("s1", "2026-03-17", null);
    expect(result.current.sessions).toEqual([]);
  });

  it("reschedule later today keeps it on today's list, planned, at the new time", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([{ ...session, status: "in_progress" }]);
    mockedWorkSessionService.rescheduleWorkSession.mockResolvedValue(undefined);

    const { result } = renderHook(() => useTodayExecution("student-1", "2026-03-16"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.reschedule("s1", "2026-03-16", "19:00"));

    expect(result.current.sessions[0]).toMatchObject({ status: "planned", startTime: "19:00", startedAt: null });
  });

  it("sets actionError when an action fails", async () => {
    mockedWorkSessionService.listWorkSessionsForDate.mockResolvedValue([session]);
    mockedWorkSessionService.startWorkSession.mockRejectedValue({ message: "boom" });

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
