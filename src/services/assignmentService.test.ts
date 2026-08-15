import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "../lib/supabase";
import { createAssignment, getAssignment } from "./assignmentService";

type QueryResult = { data: unknown; error: unknown };

// Supabase's query builder is chainable *and* awaitable from any step, so a
// mock only needs to return itself from every chain method and resolve
// when awaited.
function mockQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  const returnsBuilder = vi.fn(() => builder);
  builder.select = returnsBuilder;
  builder.eq = returnsBuilder;
  builder.insert = returnsBuilder;
  builder.single = returnsBuilder;
  builder.maybeSingle = returnsBuilder;
  builder.then = (resolve: (value: QueryResult) => unknown) =>
    Promise.resolve(result).then(resolve);
  return builder;
}

const mockedFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createAssignment", () => {
  it("inserts and returns the created assignment, trimming blank notes to null", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({
        data: {
          id: "1",
          course_id: "course-1",
          title: "Chapter 7 problem set",
          due_date: "2026-03-15",
          effort_minutes: 30,
          notes: null,
        },
        error: null,
      }),
    );

    const assignment = await createAssignment("student-1", {
      courseId: "course-1",
      title: "Chapter 7 problem set",
      dueDate: "2026-03-15",
      effortMinutes: 30,
      notes: "   ",
    });

    expect(mockedFrom).toHaveBeenCalledWith("assignments");
    expect(assignment).toEqual({
      id: "1",
      courseId: "course-1",
      title: "Chapter 7 problem set",
      dueDate: "2026-03-15",
      effortMinutes: 30,
      notes: null,
    });
  });

  it("throws when the insert errors", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({ data: null, error: new Error("boom") }),
    );

    await expect(
      createAssignment("student-1", {
        courseId: "course-1",
        title: "Chapter 7 problem set",
        dueDate: "2026-03-15",
        effortMinutes: 30,
        notes: "",
      }),
    ).rejects.toThrow("boom");
  });
});

describe("getAssignment", () => {
  it("returns the mapped assignment when found", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({
        data: {
          id: "1",
          course_id: "course-1",
          title: "Chapter 7 problem set",
          due_date: "2026-03-15",
          effort_minutes: 30,
          notes: "Bring calculator",
        },
        error: null,
      }),
    );

    expect(await getAssignment("1")).toEqual({
      id: "1",
      courseId: "course-1",
      title: "Chapter 7 problem set",
      dueDate: "2026-03-15",
      effortMinutes: 30,
      notes: "Bring calculator",
    });
  });

  it("returns null when not found", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: null }));

    expect(await getAssignment("missing")).toBeNull();
  });

  it("throws when the query errors", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({ data: null, error: new Error("boom") }),
    );

    await expect(getAssignment("1")).rejects.toThrow("boom");
  });
});
