import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "../lib/supabase";
import { isSuperuser, listKnownStudentIds } from "./superuserService";

type QueryResult = { data: unknown; error: unknown };

// Supabase's query builder is chainable *and* awaitable from any step, so a
// mock only needs to return itself from every chain method and resolve
// when awaited.
function mockQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  const returnsBuilder = vi.fn(() => builder);
  builder.select = returnsBuilder;
  builder.eq = returnsBuilder;
  builder.maybeSingle = () => Promise.resolve(result);
  builder.then = (resolve: (value: QueryResult) => unknown) =>
    Promise.resolve(result).then(resolve);
  return builder;
}

const mockedFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isSuperuser", () => {
  it("is true when a matching row exists", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: { user_id: "user-1" }, error: null }));

    expect(await isSuperuser("user-1")).toBe(true);
    expect(mockedFrom).toHaveBeenCalledWith("superusers");
  });

  it("is false when no row exists (RLS returns nothing rather than an error)", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: null }));

    expect(await isSuperuser("user-1")).toBe(false);
  });

  it("throws on a query error", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: { message: "boom" } }));

    await expect(isSuperuser("user-1")).rejects.toEqual({ message: "boom" });
  });
});

describe("listKnownStudentIds", () => {
  it("de-duplicates student ids across rows", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({
        data: [{ student_id: "student-1" }, { student_id: "student-2" }, { student_id: "student-1" }],
        error: null,
      }),
    );

    const ids = await listKnownStudentIds();

    expect(mockedFrom).toHaveBeenCalledWith("courses");
    expect(ids.sort()).toEqual(["student-1", "student-2"]);
  });

  it("returns an empty array rather than null when there are no rows", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: null }));

    expect(await listKnownStudentIds()).toEqual([]);
  });
});
