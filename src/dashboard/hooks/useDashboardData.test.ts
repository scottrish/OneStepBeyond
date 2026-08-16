import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("../../services/courseService", () => ({ listCourses: vi.fn() }));
vi.mock("../../services/assignmentService", () => ({ listAssignments: vi.fn() }));
vi.mock("../../services/workItemService", () => ({ listWorkItemsForStudent: vi.fn() }));
vi.mock("../../services/decompositionAttemptService", () => ({ listForStudent: vi.fn() }));
vi.mock("../../services/reflectionService", () => ({ listForStudent: vi.fn() }));

import * as courseService from "../../services/courseService";
import * as assignmentService from "../../services/assignmentService";
import * as workItemService from "../../services/workItemService";
import * as decompositionAttemptService from "../../services/decompositionAttemptService";
import * as reflectionService from "../../services/reflectionService";
import { useDashboardData } from "./useDashboardData";

const mockedCourseService = courseService as unknown as { listCourses: ReturnType<typeof vi.fn> };
const mockedAssignmentService = assignmentService as unknown as { listAssignments: ReturnType<typeof vi.fn> };
const mockedWorkItemService = workItemService as unknown as { listWorkItemsForStudent: ReturnType<typeof vi.fn> };
const mockedDecompositionAttemptService = decompositionAttemptService as unknown as {
  listForStudent: ReturnType<typeof vi.fn>;
};
const mockedReflectionService = reflectionService as unknown as { listForStudent: ReturnType<typeof vi.fn> };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useDashboardData", () => {
  it("loads all five collections for the student", async () => {
    mockedCourseService.listCourses.mockResolvedValue([{ id: "c1", name: "Biology", colorIndex: 0 }]);
    mockedAssignmentService.listAssignments.mockResolvedValue([
      { id: "a1", courseId: "c1", title: "Book report", dueDate: "2026-03-15", effortMinutes: 60, notes: null, completedAt: null },
    ]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([]);
    mockedDecompositionAttemptService.listForStudent.mockResolvedValue([]);
    mockedReflectionService.listForStudent.mockResolvedValue([]);

    const { result } = renderHook(() => useDashboardData("student-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedCourseService.listCourses).toHaveBeenCalledWith("student-1");
    expect(mockedAssignmentService.listAssignments).toHaveBeenCalledWith("student-1");
    expect(mockedWorkItemService.listWorkItemsForStudent).toHaveBeenCalledWith("student-1");
    expect(mockedDecompositionAttemptService.listForStudent).toHaveBeenCalledWith("student-1");
    expect(mockedReflectionService.listForStudent).toHaveBeenCalledWith("student-1");
    expect(result.current.courses).toHaveLength(1);
    expect(result.current.assignments).toHaveLength(1);
    expect(result.current.loadError).toBeNull();
  });

  it("sets loadError when any collection fails to load", async () => {
    mockedCourseService.listCourses.mockResolvedValue([]);
    mockedAssignmentService.listAssignments.mockResolvedValue([]);
    mockedWorkItemService.listWorkItemsForStudent.mockResolvedValue([]);
    mockedDecompositionAttemptService.listForStudent.mockRejectedValue({ message: "boom" });
    mockedReflectionService.listForStudent.mockResolvedValue([]);

    const { result } = renderHook(() => useDashboardData("student-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.loadError).toBe("boom");
  });
});
