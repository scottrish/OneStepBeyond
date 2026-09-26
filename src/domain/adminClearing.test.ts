import { describe, expect, it } from "vitest";
import { ALL_CATEGORIES, CLEAR_CATEGORIES, emailConfirmed, isAllCategories, removalLines } from "./adminClearing";

describe("adminClearing (admin-account-management-v0.1.md, requirement 3)", () => {
  it("the seven categories, matching the database's ids", () => {
    expect(ALL_CATEGORIES).toEqual(["courses", "assignments", "plans", "history", "activities", "study_hours", "support"]);
  });

  it("the categories that cascade say what else goes", () => {
    const courses = CLEAR_CATEGORIES.find((c) => c.id === "courses")!;
    expect(courses.alsoRemoves).toMatch(/assignments.*steps.*plan history/);
    expect(CLEAR_CATEGORIES.find((c) => c.id === "activities")!.alsoRemoves).toBeNull();
  });

  it("'All data' is every category, in any order", () => {
    expect(isAllCategories([...ALL_CATEGORIES].reverse())).toBe(true);
    expect(isAllCategories(["courses", "plans"])).toBe(false);
  });

  it("counts in words, singular and plural, in a fixed order, skipping zeros", () => {
    expect(
      removalLines({ work_items: 3, courses: 1, planning_sessions: 2, activities: 0, student_preferences: 1 }),
    ).toEqual(["1 course", "3 steps", "2 plan history entries", "1 study hours setting"]);
    expect(removalLines({})).toEqual([]);
  });

  it("typing the email to confirm ignores case and spaces (A7)", () => {
    expect(emailConfirmed("  Student@Example.com ", "student@example.com")).toBe(true);
    expect(emailConfirmed("student@example.co", "student@example.com")).toBe(false);
    expect(emailConfirmed("", "")).toBe(false);
  });
});
