import { useCallback, useState } from "react";
import { assignCourseColor } from "../domain/courseColor";
import { errorMessage } from "../lib/errorMessage";
import { useAsyncData } from "./useAsyncData";
import * as courseService from "../services/courseService";
import type { Course } from "../services/courseService";

export function useCourses(studentId: string) {
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchCourses = useCallback(() => courseService.listCourses(studentId), [studentId]);
  const { data: courses, setData: setCourses, loading, loadError, retry } = useAsyncData<Course[]>(
    fetchCourses,
    [],
  );

  async function addCourse(name: string): Promise<boolean> {
    const trimmed = name.trim();
    if (trimmed === "") return false;

    setActionError(null);
    try {
      const colorIndex = assignCourseColor(courses.length);
      const course = await courseService.createCourse(
        studentId,
        trimmed,
        colorIndex,
      );
      setCourses((prev) => [...prev, course]);
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    }
  }

  async function renameCourse(id: string, name: string): Promise<boolean> {
    const trimmed = name.trim();
    if (trimmed === "") return false;

    setActionError(null);
    try {
      await courseService.renameCourse(id, trimmed);
      setCourses((prev) =>
        prev.map((course) =>
          course.id === id ? { ...course, name: trimmed } : course,
        ),
      );
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
    actionError,
    retry,
    addCourse,
    renameCourse,
  };
}
