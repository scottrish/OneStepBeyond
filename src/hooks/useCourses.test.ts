import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("../services/courseService", () => ({
  listCourses: vi.fn(),
  createCourse: vi.fn(),
  renameCourse: vi.fn(),
}));

import * as courseService from "../services/courseService";
import { useCourses } from "./useCourses";

const mockedService = courseService as unknown as {
  listCourses: ReturnType<typeof vi.fn>;
  createCourse: ReturnType<typeof vi.fn>;
  renameCourse: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCourses", () => {
  it("loads courses for the student on mount", async () => {
    mockedService.listCourses.mockResolvedValue([
      { id: "1", name: "Biology", colorIndex: 0 },
    ]);

    const { result } = renderHook(() => useCourses("student-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedService.listCourses).toHaveBeenCalledWith("student-1");
    expect(result.current.courses).toEqual([
      { id: "1", name: "Biology", colorIndex: 0 },
    ]);
    expect(result.current.loadError).toBeNull();
  });

  it("sets loadError instead of throwing when the initial fetch fails", async () => {
    mockedService.listCourses.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useCourses("student-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.loadError).toBe("network down");
    expect(result.current.courses).toEqual([]);
  });

  it("retry re-fetches and clears loadError", async () => {
    mockedService.listCourses.mockRejectedValueOnce(new Error("network down"));
    mockedService.listCourses.mockResolvedValueOnce([
      { id: "1", name: "Biology", colorIndex: 0 },
    ]);

    const { result } = renderHook(() => useCourses("student-1"));
    await waitFor(() => expect(result.current.loadError).toBe("network down"));

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.loadError).toBeNull();
    expect(result.current.courses).toEqual([
      { id: "1", name: "Biology", colorIndex: 0 },
    ]);
  });

  it("adds a course with the next palette color and appends it locally", async () => {
    mockedService.listCourses.mockResolvedValue([
      { id: "1", name: "Biology", colorIndex: 0 },
    ]);
    mockedService.createCourse.mockResolvedValue({
      id: "2",
      name: "Algebra I",
      colorIndex: 1,
    });

    const { result } = renderHook(() => useCourses("student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let succeeded: boolean = false;
    await act(async () => {
      succeeded = await result.current.addCourse("Algebra I");
    });

    expect(succeeded).toBe(true);
    expect(mockedService.createCourse).toHaveBeenCalledWith(
      "student-1",
      "Algebra I",
      1,
    );
    expect(result.current.courses).toEqual([
      { id: "1", name: "Biology", colorIndex: 0 },
      { id: "2", name: "Algebra I", colorIndex: 1 },
    ]);
  });

  it("does not add a course with a blank name", async () => {
    mockedService.listCourses.mockResolvedValue([]);

    const { result } = renderHook(() => useCourses("student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let succeeded: boolean = true;
    await act(async () => {
      succeeded = await result.current.addCourse("   ");
    });

    expect(succeeded).toBe(false);
    expect(mockedService.createCourse).not.toHaveBeenCalled();
  });

  it("renames a course locally after the service call succeeds", async () => {
    mockedService.listCourses.mockResolvedValue([
      { id: "1", name: "Biology", colorIndex: 0 },
    ]);
    mockedService.renameCourse.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCourses("student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.renameCourse("1", "Biology II"));

    expect(mockedService.renameCourse).toHaveBeenCalledWith("1", "Biology II");
    expect(result.current.courses).toEqual([
      { id: "1", name: "Biology II", colorIndex: 0 },
    ]);
  });

  it("sets actionError and returns false when adding fails, using the real error message", async () => {
    mockedService.listCourses.mockResolvedValue([]);
    mockedService.createCourse.mockRejectedValue({ message: "permission denied" });

    const { result } = renderHook(() => useCourses("student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let succeeded: boolean = true;
    await act(async () => {
      succeeded = await result.current.addCourse("Biology");
    });

    expect(succeeded).toBe(false);
    expect(result.current.actionError).toBe("permission denied");
    expect(result.current.courses).toEqual([]);
  });

  it("falls back to a stringified error only when no message is present", async () => {
    mockedService.listCourses.mockResolvedValue([]);
    mockedService.createCourse.mockRejectedValue("plain string failure");

    const { result } = renderHook(() => useCourses("student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addCourse("Biology");
    });

    expect(result.current.actionError).toBe("plain string failure");
  });
});
