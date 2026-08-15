import { useCallback, useEffect, useState } from "react";
import { assignCourseColor } from "../domain/courseColor";
import * as courseService from "../services/courseService";
import type { Course } from "../services/courseService";

function errorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return String(error);
}

export function useCourses(studentId: string) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchCourses = useCallback(() => {
    return courseService
      .listCourses(studentId)
      .then((data) => setCourses(data))
      .catch((error) => setLoadError(errorMessage(error)))
      .finally(() => setLoading(false));
  }, [studentId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  function retry() {
    setLoading(true);
    setLoadError(null);
    fetchCourses();
  }

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
