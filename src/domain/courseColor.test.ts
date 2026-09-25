import { describe, expect, it } from "vitest";
import {
  COURSE_COLORS,
  courseColorLabel,
  courseColorValue,
  courseDeleteWarning,
  nextCourseColor,
} from "./courseColor";

describe("COURSE_COLORS", () => {
  it("has the prototype's 8 named colours, the original 5 first in their original order", () => {
    expect(COURSE_COLORS.map((c) => c.label)).toEqual([
      "Clay",
      "Fern",
      "Amber",
      "Violet",
      "Slate blue",
      "Teal",
      "Rose",
      "Moss",
    ]);
    expect(COURSE_COLORS.slice(0, 5).map((c) => c.value)).toEqual([
      "var(--course-1)",
      "var(--course-2)",
      "var(--course-3)",
      "var(--course-4)",
      "var(--course-5)",
    ]);
  });
});

describe("nextCourseColor", () => {
  it("is the first colour for the first course", () => {
    expect(nextCourseColor([])).toBe(0);
  });

  it("is the first colour no existing course uses, even with gaps", () => {
    expect(nextCourseColor([0, 1])).toBe(2);
    expect(nextCourseColor([0, 2, 3])).toBe(1);
  });

  it("cycles by course count once every colour is taken", () => {
    const all = COURSE_COLORS.map((_, i) => i);
    expect(nextCourseColor(all)).toBe(0);
    expect(nextCourseColor([...all, 0])).toBe(1);
  });
});

describe("courseColorValue / courseColorLabel", () => {
  it("returns the CSS value and name for an index", () => {
    expect(courseColorValue(5)).toBe("var(--course-6)");
    expect(courseColorLabel(5)).toBe("Teal");
  });

  it("wraps out-of-range indexes back into the palette", () => {
    expect(courseColorValue(COURSE_COLORS.length)).toBe(COURSE_COLORS[0]!.value);
  });
});

describe("courseDeleteWarning", () => {
  it("asks plainly for a course with no assignments", () => {
    expect(courseDeleteWarning("Biology", 0)).toEqual({ title: "Delete Biology?", detail: null });
  });

  it("warns that every assignment goes, whatever its state, with the count", () => {
    const warning = courseDeleteWarning("Biology", 3);
    expect(warning.title).toBe("Delete Biology and all its assignments?");
    expect(warning.detail).toBe(
      "This also deletes its 3 assignments: ones you haven’t planned yet, ones you’ve planned, " +
        "and ones you’ve completed. Their steps, planned time and reflections go too. " +
        "This can’t be undone.",
    );
  });

  it("uses the singular for one assignment", () => {
    expect(courseDeleteWarning("Biology", 1).detail).toMatch(/^This also deletes its 1 assignment:/);
  });
});
