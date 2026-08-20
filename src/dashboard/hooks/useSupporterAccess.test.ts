import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("../../services/superuserService", () => ({
  isSuperuser: vi.fn(),
  listKnownStudentIds: vi.fn(),
}));
vi.mock("../../services/supportRelationshipService", () => ({
  listActiveRelationshipsForSupporter: vi.fn(),
}));

import * as superuserService from "../../services/superuserService";
import * as supportRelationshipService from "../../services/supportRelationshipService";
import { useSupporterAccess } from "./useSupporterAccess";

const mockedSuperuserService = superuserService as unknown as {
  isSuperuser: ReturnType<typeof vi.fn>;
  listKnownStudentIds: ReturnType<typeof vi.fn>;
};
const mockedSupportRelationshipService = supportRelationshipService as unknown as {
  listActiveRelationshipsForSupporter: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useSupporterAccess", () => {
  it("resolves an ordinary supporter's Active relationships without checking known student ids", async () => {
    mockedSuperuserService.isSuperuser.mockResolvedValue(false);
    mockedSupportRelationshipService.listActiveRelationshipsForSupporter.mockResolvedValue([
      { id: "r1", studentId: "student-1", role: "coach" },
    ]);

    const { result } = renderHook(() => useSupporterAccess("supporter-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.superuser).toBe(false);
    expect(result.current.relationships).toEqual([
      { id: "r1", studentId: "student-1", role: "coach" },
    ]);
    expect(result.current.knownStudentIds).toEqual([]);
    // Not superuser — listKnownStudentIds relies entirely on the
    // superuser RLS policy, so there's no reason to call it.
    expect(mockedSuperuserService.listKnownStudentIds).not.toHaveBeenCalled();
    expect(result.current.loadError).toBeNull();
  });

  it("also loads known student ids for a superuser", async () => {
    mockedSuperuserService.isSuperuser.mockResolvedValue(true);
    mockedSuperuserService.listKnownStudentIds.mockResolvedValue(["student-1", "student-2"]);
    mockedSupportRelationshipService.listActiveRelationshipsForSupporter.mockResolvedValue([]);

    const { result } = renderHook(() => useSupporterAccess("superuser-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.superuser).toBe(true);
    expect(result.current.knownStudentIds).toEqual(["student-1", "student-2"]);
  });

  it("sets loadError when a lookup fails", async () => {
    mockedSuperuserService.isSuperuser.mockRejectedValue({ message: "boom" });

    const { result } = renderHook(() => useSupporterAccess("supporter-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.loadError).toBe("boom");
  });

  it("retry re-runs the lookups", async () => {
    mockedSuperuserService.isSuperuser.mockResolvedValue(false);
    mockedSupportRelationshipService.listActiveRelationshipsForSupporter.mockResolvedValue([]);

    const { result } = renderHook(() => useSupporterAccess("supporter-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedSuperuserService.isSuperuser).toHaveBeenCalledTimes(1);

    result.current.retry();

    await waitFor(() => expect(mockedSuperuserService.isSuperuser).toHaveBeenCalledTimes(2));
  });
});
