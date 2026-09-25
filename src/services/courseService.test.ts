import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "../lib/supabase";
import { createCourse, deleteCourse, listCourses, updateCourse } from "./courseService";

type QueryResult = { data: unknown; error: unknown };

// Supabase's query builder is chainable *and* awaitable from any step, so a
// mock only needs to return itself from every chain method and resolve
// when awaited.
function mockQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  const returnsBuilder = vi.fn(() => builder);
  builder.select = returnsBuilder;
  builder.eq = returnsBuilder;
  builder.order = returnsBuilder;
  builder.insert = returnsBuilder;
  builder.update = returnsBuilder;
  builder.delete = returnsBuilder;
  builder.single = returnsBuilder;
  builder.then = (resolve: (value: QueryResult) => unknown) =>
    Promise.resolve(result).then(resolve);
  return builder;
}

const mockedFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listCourses", () => {
  it("maps rows into Course objects ordered as returned", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({
        data: [
          { id: "1", name: "Biology", color_index: 0 },
          { id: "2", name: "Algebra I", color_index: 1 },
        ],
        error: null,
      }),
    );

    const courses = await listCourses("student-1");

    expect(mockedFrom).toHaveBeenCalledWith("courses");
    expect(courses).toEqual([
      { id: "1", name: "Biology", colorIndex: 0 },
      { id: "2", name: "Algebra I", colorIndex: 1 },
    ]);
  });

  it("returns an empty list when there is no data", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: null }));

    expect(await listCourses("student-1")).toEqual([]);
  });

  it("throws when the query errors", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({ data: null, error: new Error("boom") }),
    );

    await expect(listCourses("student-1")).rejects.toThrow("boom");
  });
});

describe("createCourse", () => {
  it("inserts and returns the created course", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({
        data: { id: "1", name: "Biology", color_index: 2 },
        error: null,
      }),
    );

    const course = await createCourse("student-1", "Biology", 2);

    expect(course).toEqual({ id: "1", name: "Biology", colorIndex: 2 });
  });

  it("throws when the insert errors", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({ data: null, error: new Error("boom") }),
    );

    await expect(createCourse("student-1", "Biology", 0)).rejects.toThrow(
      "boom",
    );
  });
});

describe("updateCourse", () => {
  it("updates the course's name and colour together", async () => {
    const builder = mockQuery({ data: null, error: null });
    mockedFrom.mockReturnValue(builder);

    await expect(
      updateCourse("course-1", { name: "Biology II", colorIndex: 6 }),
    ).resolves.toBeUndefined();
    expect(builder.update).toHaveBeenCalledWith({ name: "Biology II", color_index: 6 });
    expect(builder.eq).toHaveBeenCalledWith("id", "course-1");
  });

  it("throws when the update errors", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: new Error("boom") }));

    await expect(updateCourse("course-1", { name: "Biology II", colorIndex: 0 })).rejects.toThrow(
      "boom",
    );
  });
});

describe("deleteCourse", () => {
  it("deletes the course by id (the database cascades to its assignments)", async () => {
    const builder = mockQuery({ data: null, error: null });
    mockedFrom.mockReturnValue(builder);

    await expect(deleteCourse("course-1")).resolves.toBeUndefined();
    expect(mockedFrom).toHaveBeenCalledWith("courses");
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("id", "course-1");
  });

  it("throws when the delete errors", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: new Error("boom") }));

    await expect(deleteCourse("course-1")).rejects.toThrow("boom");
  });
});
