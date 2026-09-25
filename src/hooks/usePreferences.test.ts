import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("../services/preferencesService", () => ({
  getPreferences: vi.fn(),
  upsertPreferences: vi.fn(),
  DEFAULT_PREFERENCES: { weekdayFinishTime: "21:00", saturdayHours: 2, sundayHours: 2 },
}));

import * as preferencesService from "../services/preferencesService";
import { usePreferences } from "./usePreferences";

const mockedService = preferencesService as unknown as {
  getPreferences: ReturnType<typeof vi.fn>;
  upsertPreferences: ReturnType<typeof vi.fn>;
};

const saved = { weekdayFinishTime: "19:30", saturdayHours: 5, sundayHours: 3 };
const defaults = { weekdayFinishTime: "21:00", saturdayHours: 2, sundayHours: 2 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("usePreferences", () => {
  it("starts with DEFAULT_PREFERENCES before the fetch resolves, then loads the real values", async () => {
    mockedService.getPreferences.mockResolvedValue(saved);

    const { result } = renderHook(() => usePreferences("student-1"));
    expect(result.current.preferences).toEqual(defaults);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedService.getPreferences).toHaveBeenCalledWith("student-1");
    expect(result.current.preferences).toEqual(saved);
  });

  it("sets loadError when the initial fetch fails", async () => {
    mockedService.getPreferences.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => usePreferences("student-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.loadError).toBe("network down");
  });

  it("savePreferences upserts and updates local state", async () => {
    mockedService.getPreferences.mockResolvedValue(defaults);
    mockedService.upsertPreferences.mockResolvedValue(saved);

    const { result } = renderHook(() => usePreferences("student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.savePreferences(saved);
    });

    expect(succeeded).toBe(true);
    expect(mockedService.upsertPreferences).toHaveBeenCalledWith("student-1", saved);
    expect(result.current.preferences).toEqual(saved);
    expect(result.current.saveStatus).toBe("saved");
  });

  it("when saving fails, reports the error, keeps the unsaved value on screen, and retrySave sends it again", async () => {
    mockedService.getPreferences.mockResolvedValue(defaults);
    mockedService.upsertPreferences.mockRejectedValueOnce({ message: "boom" });

    const { result } = renderHook(() => usePreferences("student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let succeeded = true;
    await act(async () => {
      succeeded = await result.current.savePreferences(saved);
    });

    expect(succeeded).toBe(false);
    expect(result.current.actionError).toBe("boom");
    expect(result.current.preferences).toEqual(saved);

    mockedService.upsertPreferences.mockResolvedValue(saved);
    await act(async () => {
      result.current.retrySave();
    });

    await waitFor(() => expect(result.current.saveStatus).toBe("saved"));
    expect(result.current.actionError).toBeNull();
    expect(mockedService.upsertPreferences).toHaveBeenLastCalledWith("student-1", saved);
  });

  it("sends one save at a time, and only the newest change made while one was in flight", async () => {
    mockedService.getPreferences.mockResolvedValue(defaults);
    let finishFirst: () => void = () => {};
    mockedService.upsertPreferences
      .mockImplementationOnce(() => new Promise<void>((resolve) => (finishFirst = resolve)))
      .mockResolvedValue(undefined);

    const { result } = renderHook(() => usePreferences("student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const tap = (saturdayHours: number) => ({ ...defaults, saturdayHours });
    let first: Promise<boolean> = Promise.resolve(false);
    act(() => {
      first = result.current.savePreferences(tap(2.5));
    });
    act(() => {
      void result.current.savePreferences(tap(3));
    });
    act(() => {
      void result.current.savePreferences(tap(3.5));
    });
    expect(result.current.preferences).toEqual(tap(3.5));
    expect(result.current.saveStatus).toBe("saving");
    expect(mockedService.upsertPreferences).toHaveBeenCalledTimes(1);

    await act(async () => {
      finishFirst();
      await first;
    });

    expect(mockedService.upsertPreferences).toHaveBeenCalledTimes(2);
    expect(mockedService.upsertPreferences).toHaveBeenLastCalledWith("student-1", tap(3.5));
    expect(result.current.preferences).toEqual(tap(3.5));
    expect(result.current.saveStatus).toBe("saved");
  });
});
