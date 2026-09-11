import { useCallback } from "react";
import { useAsyncData } from "../../hooks/useAsyncData";
import * as assignmentService from "../../services/assignmentService";
import * as courseService from "../../services/courseService";
import * as decompositionAttemptService from "../../services/decompositionAttemptService";
import * as reflectionService from "../../services/reflectionService";
import * as workItemService from "../../services/workItemService";
import type { Assignment } from "../../services/assignmentService";
import type { Course } from "../../services/courseService";
import type { DecompositionAttempt } from "../../services/decompositionAttemptService";
import type { Reflection } from "../../services/reflectionService";
import type { WorkItem } from "../../services/workItemService";

export type DashboardData = {
  courses: Course[];
  assignments: Assignment[];
  workItems: WorkItem[];
  decompositionAttempts: DecompositionAttempt[];
  reflections: Reflection[];
};

const EMPTY: DashboardData = {
  courses: [],
  assignments: [],
  workItems: [],
  decompositionAttempts: [],
  reflections: [],
};

// docs/features/coach-parent-dashboard-feature-spec-v0.1.md — the
// dashboard signs in as the same student (see the spec's Implementation
// Note), so this is a plain read of that student's own data via the
// existing services and RLS. One combined fetch since every Phase 1
// screen needs some overlapping subset of the same five collections.
export function useDashboardData(studentId: string) {
  const fetchData = useCallback(
    () =>
      Promise.all([
        courseService.listCourses(studentId),
        assignmentService.listAssignments(studentId),
        workItemService.listWorkItemsForStudent(studentId),
        decompositionAttemptService.listForStudent(studentId),
        reflectionService.listForStudent(studentId),
      ]).then(([courses, assignments, workItems, decompositionAttempts, reflections]) => ({
        courses,
        assignments,
        workItems,
        decompositionAttempts,
        reflections,
      })),
    [studentId],
  );

  const { data, loading, loadError } = useAsyncData<DashboardData>(fetchData, EMPTY);

  return { ...data, loading, loadError };
}
