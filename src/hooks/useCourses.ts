import { useCallback, useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import { useAsyncData } from "./useAsyncData";
import * as courseService from "../services/courseService";
import type { Course } from "../services/courseService";

export function useCourses(studentId: string) {
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchCourses = useCallback(() => courseService.listCourses(studentId), [studentId]);
  const {
    data: courses,
    setData: setCourses,
    loading,
    loadError,
    refreshError,
    retry,
  } = useAsyncData<Course[]>(fetchCourses, [], { peek: () => courseService.peekCourses(studentId) });

  // The colour is chosen on the Courses screen, pre-set there to one no
  // other course uses (nextCourseColor).
  async function addCourse(name: string, colorIndex: number): Promise<boolean> {
    const trimmed = name.trim();
    if (trimmed === "") return false;

    setActionError(null);
    try {
      const course = await courseService.createCourse(studentId, trimmed, colorIndex);
      setCourses((prev) => [...prev, course]);
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    }
  }

  // Name and colour together (docs/decisions/20260925-course-colour-and-delete.md, C2).
  async function updateCourse(id: string, name: string, colorIndex: number): Promise<boolean> {
    const trimmed = name.trim();
    if (trimmed === "") return false;

    setActionError(null);
    try {
      await courseService.updateCourse(id, { name: trimmed, colorIndex });
      setCourses((prev) =>
        prev.map((course) => (course.id === id ? { ...course, name: trimmed, colorIndex } : course)),
      );
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    }
  }

  // Deletes the course and everything in it (the database cascades).
  async function deleteCourse(id: string): Promise<boolean> {
    setActionError(null);
    try {
      await courseService.deleteCourse(id);
      setCourses((prev) => prev.filter((course) => course.id !== id));
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    }
  }

  return {
    courses,
    loading,
    loadError,
    refreshError,
    actionError,
    retry,
    addCourse,
    updateCourse,
    deleteCourse,
  };
}
