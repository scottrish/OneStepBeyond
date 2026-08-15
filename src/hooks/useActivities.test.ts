import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("../services/activityService", () => ({
  listActivities: vi.fn(),
  createActivity: vi.fn(),
  updateActivityDays: vi.fn(),
  deleteActivity: vi.fn(),
}));

import * as activityService from "../services/activityService";
import { useActivities } from "./useActivities";

const mockedService = activityService as unknown as {
  listActivities: ReturnType<typeof vi.fn>;
  createActivity: ReturnType<typeof vi.fn>;
  updateActivityDays: ReturnType<typeof vi.fn>;
  deleteActivity: ReturnType<typeof vi.fn>;
};

const activity = {
  id: "1",
  name: "Football practice",
  days: [1, 2, 3, 4, 5],
  startTime: "15:30",
  finishTime: "17:00",
  travelMinutes: 15,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useActivities", () => {
  it("loads activities for the student on mount", async () => {
    mockedService.listActivities.mockResolvedValue([activity]);

    const { result } = renderHook(() => useActivities("student-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedService.listActivities).toHaveBeenCalledWith("student-1");
    expect(result.current.activities).toEqual([activity]);
  });

  it("sets loadError when the initial fetch fails", async () => {
    mockedService.listActivities.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useActivities("student-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.loadError).toBe("network down");
  });

  it("adds an activity and appends it locally", async () => {
    mockedService.listActivities.mockResolvedValue([]);
    mockedService.createActivity.mockResolvedValue(activity);

    const { result } = renderHook(() => useActivities("student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.addActivity({
        name: "Football practice",
        days: [1, 2, 3, 4, 5],
        startTime: "15:30",
        finishTime: "17:00",
        travelMinutes: 15,
      });
    });

    expect(succeeded).toBe(true);
    expect(result.current.activities).toEqual([activity]);
  });

  it("updates an activity's days locally after the service call succeeds", async () => {
    mockedService.listActivities.mockResolvedValue([activity]);
    mockedService.updateActivityDays.mockResolvedValue(undefined);

    const { result } = renderHook(() => useActivities("student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.updateDays("1", [1, 2]));

    expect(mockedService.updateActivityDays).toHaveBeenCalledWith("1", [1, 2]);
    expect(result.current.activities[0].days).toEqual([1, 2]);
  });

  it("removes an activity locally after the service call succeeds", async () => {
    mockedService.listActivities.mockResolvedValue([activity]);
    mockedService.deleteActivity.mockResolvedValue(undefined);

    const { result } = renderHook(() => useActivities("student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.removeActivity("1"));

    expect(mockedService.deleteActivity).toHaveBeenCalledWith("1");
    expect(result.current.activities).toEqual([]);
  });

  it("sets actionError and keeps state unchanged when adding fails", async () => {
    mockedService.listActivities.mockResolvedValue([]);
    mockedService.createActivity.mockRejectedValue({ message: "boom" });

    const { result } = renderHook(() => useActivities("student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addActivity({
        name: "Football practice",
        days: [1],
        startTime: "15:30",
        finishTime: "17:00",
        travelMinutes: 0,
      });
    });

    expect(result.current.actionError).toBe("boom");
    expect(result.current.activities).toEqual([]);
  });
});
