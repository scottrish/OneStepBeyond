import { describe, expect, it } from "vitest";
import {
  COURSE_COLOR_PALETTE,
  assignCourseColor,
  courseColorValue,
} from "./courseColor";

describe("assignCourseColor", () => {
  it("assigns the first palette color to the first course", () => {
    expect(assignCourseColor(0)).toBe(0);
  });

  it("assigns each subsequent course the next palette color", () => {
    expect(assignCourseColor(1)).toBe(1);
    expect(assignCourseColor(2)).toBe(2);
  });

  it("cycles back to the start once the palette is exhausted", () => {
    expect(assignCourseColor(COURSE_COLOR_PALETTE.length)).toBe(0);
    expect(assignCourseColor(COURSE_COLOR_PALETTE.length + 1)).toBe(1);
  });
});

describe("courseColorValue", () => {
  it("returns the CSS color value for a color index", () => {
    expect(courseColorValue(0)).toBe(COURSE_COLOR_PALETTE[0]);
  });

  it("wraps out-of-range indexes back into the palette", () => {
    expect(courseColorValue(COURSE_COLOR_PALETTE.length)).toBe(
      COURSE_COLOR_PALETTE[0],
    );
  });
});
