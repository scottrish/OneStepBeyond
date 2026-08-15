import { useEffect, useState } from "react";
import { assignCourseColor } from "../domain/courseColor";
import * as courseService from "../services/courseService";
import type { Course } from "../services/courseService";

export function useCourses(studentId: string) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    courseService
      .listCourses(studentId)
      .then((data) => {
        if (!cancelled) setCourses(data);
      })
      .catch((error) => {
        alert(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  async function addCourse(name: string) {
    const trimmed = name.trim();
    if (trimmed === "") return;

    try {
      const colorIndex = assignCourseColor(courses.length);
      const course = await courseService.createCourse(
        studentId,
        trimmed,
        colorIndex,
      );
      setCourses((prev) => [...prev, course]);
    } catch (error) {
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  async function renameCourse(id: string, name: string) {
    const trimmed = name.trim();
    if (trimmed === "") return;

    try {
      await courseService.renameCourse(id, trimmed);
      setCourses((prev) =>
        prev.map((course) =>
          course.id === id ? { ...course, name: trimmed } : course,
        ),
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : String(error));
    }
  }

  return { courses, loading, addCourse, renameCourse };
}
