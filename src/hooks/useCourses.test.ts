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

    await act(() => result.current.addCourse("Algebra I"));

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

    await act(() => result.current.addCourse("   "));

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

  it("alerts and keeps state unchanged when adding fails", async () => {
    mockedService.listCourses.mockResolvedValue([]);
    mockedService.createCourse.mockRejectedValue(new Error("boom"));
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const { result } = renderHook(() => useCourses("student-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.addCourse("Biology"));

    expect(alertSpy).toHaveBeenCalledWith("boom");
    expect(result.current.courses).toEqual([]);
  });
});
