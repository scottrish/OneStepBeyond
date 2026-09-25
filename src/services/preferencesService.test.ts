import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "../lib/supabase";
import { DEFAULT_PREFERENCES, getPreferences, upsertPreferences } from "./preferencesService";

type QueryResult = { data: unknown; error: unknown };

function mockQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  const returnsBuilder = vi.fn(() => builder);
  builder.select = returnsBuilder;
  builder.eq = returnsBuilder;
  builder.upsert = returnsBuilder;
  builder.single = returnsBuilder;
  builder.maybeSingle = () => Promise.resolve(result);
  builder.then = (resolve: (value: QueryResult) => unknown) =>
    Promise.resolve(result).then(resolve);
  return builder;
}

const mockedFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getPreferences", () => {
  it("maps an existing row into Preferences", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({
        data: { weekday_finish_time: "20:30", saturday_hours: 6, sunday_hours: "1.5" },
        error: null,
      }),
    );

    const preferences = await getPreferences("student-1");

    expect(mockedFrom).toHaveBeenCalledWith("student_preferences");
    // numeric columns are coerced, even if returned as strings.
    expect(preferences).toEqual({ weekdayFinishTime: "20:30", saturdayHours: 6, sundayHours: 1.5 });
  });

  it("defaults a student with no row to 2 hours each on Saturday and Sunday", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: null }));

    expect(await getPreferences("student-1")).toEqual(DEFAULT_PREFERENCES);
    expect(DEFAULT_PREFERENCES).toEqual({
      weekdayFinishTime: "21:00",
      saturdayHours: 2,
      sundayHours: 2,
    });
  });

  it("throws when the query errors", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({ data: null, error: new Error("boom") }),
    );

    await expect(getPreferences("student-1")).rejects.toThrow("boom");
  });
});

describe("upsertPreferences", () => {
  it("upserts and returns the saved preferences", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({
        data: { weekday_finish_time: "19:00", saturday_hours: 4, sunday_hours: 3 },
        error: null,
      }),
    );

    const preferences = await upsertPreferences("student-1", {
      weekdayFinishTime: "19:00",
      saturdayHours: 4,
      sundayHours: 3,
    });

    expect(preferences).toEqual({ weekdayFinishTime: "19:00", saturdayHours: 4, sundayHours: 3 });
  });

  it("throws when the upsert errors", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({ data: null, error: new Error("boom") }),
    );

    await expect(
      upsertPreferences("student-1", { weekdayFinishTime: "19:00", saturdayHours: 4, sundayHours: 3 }),
    ).rejects.toThrow("boom");
  });
});
