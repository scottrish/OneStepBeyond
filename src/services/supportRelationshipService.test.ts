import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "../lib/supabase";
import { listActiveRelationshipsForSupporter } from "./supportRelationshipService";

type QueryResult = { data: unknown; error: unknown };

// Supabase's query builder is chainable *and* awaitable from any step, so a
// mock only needs to return itself from every chain method and resolve
// when awaited.
function mockQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  const returnsBuilder = vi.fn(() => builder);
  builder.select = returnsBuilder;
  builder.eq = returnsBuilder;
  builder.then = (resolve: (value: QueryResult) => unknown) =>
    Promise.resolve(result).then(resolve);
  return builder;
}

const mockedFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listActiveRelationshipsForSupporter", () => {
  it("queries support_relationships scoped to the supporter and Active status, and maps rows", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({
        data: [
          { id: "r1", student_id: "student-1", role: "coach" },
          { id: "r2", student_id: "student-2", role: "parent_guardian" },
        ],
        error: null,
      }),
    );

    const relationships = await listActiveRelationshipsForSupporter("supporter-1");

    expect(mockedFrom).toHaveBeenCalledWith("support_relationships");
    expect(relationships).toEqual([
      { id: "r1", studentId: "student-1", role: "coach" },
      { id: "r2", studentId: "student-2", role: "parent_guardian" },
    ]);
  });

  it("returns an empty array rather than null when there are no Active relationships", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: null }));

    const relationships = await listActiveRelationshipsForSupporter("supporter-1");

    expect(relationships).toEqual([]);
  });

  it("throws on a query error", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: { message: "boom" } }));

    await expect(listActiveRelationshipsForSupporter("supporter-1")).rejects.toEqual({
      message: "boom",
    });
  });
});
