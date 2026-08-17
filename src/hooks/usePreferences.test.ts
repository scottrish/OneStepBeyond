import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("../services/preferencesService", () => ({
  getPreferences: vi.fn(),
  upsertPreferences: vi.fn(),
  DEFAULT_PREFERENCES: { weekdayFinishTime: "21:00", weekendHours: 10 },
}));

import * as preferencesService from "../services/preferencesService";
import { usePreferences } from "./usePreferences";

const mockedService = preferencesService as unknown as {
  getPreferences: ReturnType<typeof vi.fn>;
  upsertPreferences: ReturnType<typeof vi.fn>;
};

const saved = { weekdayFinishTime: "19:30", weekendHours: 5 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("usePreferences", () => {
  it("starts with DEFAULT_PREFERENCES before the fetch resolves, then loads the real values", async () => {
    mockedService.getPreferences.mockResolvedValue(saved);

    const { result } = renderHook(() => usePreferences("student-1"));
    expect(result.current.preferences).toEqual({ weekdayFinishTime: "21:00", weekendHours: 10 });

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
    mockedService.getPreferences.mockResolvedValue({ weekdayFinishTime: "21:00", weekendHours: 10 });
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
  });

  it("sets actionError and keeps prior preferences when saving fails", async () => {
    const initial = { weekdayFinishTime: "21:00", weekendHours: 10 };
    mockedService.getPreferences.mockResolvedValue(initial);
    mockedService.upsertPreferences.mockRejectedValue({ message: "boom" });

    const { result } = renderHook(() => usePreferences("student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let succeeded = true;
    await act(async () => {
      succeeded = await result.current.savePreferences(saved);
    });

    expect(succeeded).toBe(false);
    expect(result.current.actionError).toBe("boom");
    expect(result.current.preferences).toEqual(initial);
  });
});
