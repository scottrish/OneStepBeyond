import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAssignmentRisk } from "./useAssignmentRisk";

vi.mock("../services/activityService", () => ({ listActivities: vi.fn() }));
vi.mock("../services/workSessionService", () => ({ listWorkSessionsForStudent: vi.fn() }));
vi.mock("../services/preferencesService", () => ({
  getPreferences: vi.fn(),
  DEFAULT_PREFERENCES: { weekdayFinishTime: "21:00", weekendHours: 10 },
}));

import * as activityService from "../services/activityService";
import * as workSessionService from "../services/workSessionService";
import * as preferencesService from "../services/preferencesService";

const mockedActivityService = activityService as unknown as { listActivities: ReturnType<typeof vi.fn> };
const mockedWorkSessionService = workSessionService as unknown as {
  listWorkSessionsForStudent: ReturnType<typeof vi.fn>;
};
const mockedPreferencesService = preferencesService as unknown as {
  getPreferences: ReturnType<typeof vi.fn>;
};

const assignment = {
  id: "a1",
  courseId: "c1",
  title: "Essay",
  dueDate: "2026-03-16",
  effortMinutes: 90,
  notes: null,
  completedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedActivityService.listActivities.mockResolvedValue([]);
  mockedWorkSessionService.listWorkSessionsForStudent.mockResolvedValue([]);
  mockedPreferencesService.getPreferences.mockResolvedValue({
    weekdayFinishTime: "21:00",
    weekendHours: 10,
  });
});

describe("useAssignmentRisk", () => {
  it("suggests a breakdown for a large assignment with no Work Items", async () => {
    const { result } = renderHook(() => useAssignmentRisk("student-1", assignment, []));

    await waitFor(() => expect(result.current.suggestBreakdown).toBe(true));
  });

  it("does not suggest a breakdown once Work Items exist", async () => {
    const { result } = renderHook(() =>
      useAssignmentRisk("student-1", assignment, [
        { id: "w1", assignmentId: "a1", title: "Draft", effortMinutes: 90, completedAt: null, position: 0 },
      ]),
    );

    await waitFor(() => expect(mockedActivityService.listActivities).toHaveBeenCalled());
    expect(result.current.suggestBreakdown).toBe(false);
  });

  it("does not suggest a breakdown for a small assignment", async () => {
    const { result } = renderHook(() =>
      useAssignmentRisk("student-1", { ...assignment, effortMinutes: 30 }, []),
    );

    await waitFor(() => expect(mockedActivityService.listActivities).toHaveBeenCalled());
    expect(result.current.suggestBreakdown).toBe(false);
  });

  it("returns no attentionItem while the underlying data is still loading", () => {
    const { result } = renderHook(() => useAssignmentRisk("student-1", assignment, []));

    expect(result.current.attentionItem).toBeUndefined();
  });

  it("returns no attentionItem when assignment is null", async () => {
    const { result } = renderHook(() => useAssignmentRisk("student-1", null, []));

    await waitFor(() => expect(mockedActivityService.listActivities).toHaveBeenCalled());
    expect(result.current.attentionItem).toBeUndefined();
  });
});
