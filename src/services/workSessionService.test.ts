import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "../lib/supabase";
import {
  createWorkSessions,
  deletePlannedSessionsForDate,
  deleteWorkSession,
  listWorkSessionsForDate,
  listWorkSessionsForStudent,
} from "./workSessionService";

type QueryResult = { data: unknown; error: unknown };

function mockQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  const returnsBuilder = vi.fn(() => builder);
  builder.select = returnsBuilder;
  builder.eq = returnsBuilder;
  builder.insert = returnsBuilder;
  builder.delete = returnsBuilder;
  builder.then = (resolve: (value: QueryResult) => unknown) =>
    Promise.resolve(result).then(resolve);
  return builder;
}

const mockedFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

const row = {
  id: "1",
  work_item_id: "w1",
  date: "2026-03-16",
  planned_minutes: 30,
  start_time: "16:00:00",
  status: "planned" as const,
};

describe("listWorkSessionsForDate", () => {
  it("maps rows into WorkSession objects", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: [row], error: null }));

    const sessions = await listWorkSessionsForDate("student-1", "2026-03-16");

    expect(mockedFrom).toHaveBeenCalledWith("work_sessions");
    expect(sessions).toEqual([
      {
        id: "1",
        workItemId: "w1",
        date: "2026-03-16",
        plannedMinutes: 30,
        startTime: "16:00:00",
        status: "planned",
      },
    ]);
  });

  it("returns an empty list when there is no data", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: null }));

    expect(await listWorkSessionsForDate("student-1", "2026-03-16")).toEqual([]);
  });

  it("throws when the query errors", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: new Error("boom") }));

    await expect(listWorkSessionsForDate("student-1", "2026-03-16")).rejects.toThrow("boom");
  });
});

describe("listWorkSessionsForStudent", () => {
  it("maps rows into WorkSession objects across all dates", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: [row], error: null }));

    const sessions = await listWorkSessionsForStudent("student-1");

    expect(mockedFrom).toHaveBeenCalledWith("work_sessions");
    expect(sessions).toEqual([
      {
        id: "1",
        workItemId: "w1",
        date: "2026-03-16",
        plannedMinutes: 30,
        startTime: "16:00:00",
        status: "planned",
      },
    ]);
  });

  it("throws when the query errors", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: new Error("boom") }));

    await expect(listWorkSessionsForStudent("student-1")).rejects.toThrow("boom");
  });
});

describe("createWorkSessions", () => {
  it("inserts and returns the created sessions", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: [row], error: null }));

    const sessions = await createWorkSessions("student-1", [
      { workItemId: "w1", date: "2026-03-16", plannedMinutes: 30, startTime: "16:00" },
    ]);

    expect(sessions).toEqual([
      {
        id: "1",
        workItemId: "w1",
        date: "2026-03-16",
        plannedMinutes: 30,
        startTime: "16:00:00",
        status: "planned",
      },
    ]);
  });

  it("returns an empty array without calling supabase when there is nothing to insert", async () => {
    const result = await createWorkSessions("student-1", []);

    expect(result).toEqual([]);
    expect(mockedFrom).not.toHaveBeenCalled();
  });

  it("throws when the insert errors", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: new Error("boom") }));

    await expect(
      createWorkSessions("student-1", [
        { workItemId: "w1", date: "2026-03-16", plannedMinutes: 30, startTime: null },
      ]),
    ).rejects.toThrow("boom");
  });
});

describe("deletePlannedSessionsForDate", () => {
  it("deletes only that date's planned sessions", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: null }));

    await expect(
      deletePlannedSessionsForDate("student-1", "2026-03-16"),
    ).resolves.toBeUndefined();
  });

  it("throws when the delete errors", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: new Error("boom") }));

    await expect(
      deletePlannedSessionsForDate("student-1", "2026-03-16"),
    ).rejects.toThrow("boom");
  });
});

describe("deleteWorkSession", () => {
  it("deletes a single session", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: null }));

    await expect(deleteWorkSession("session-1")).resolves.toBeUndefined();
  });

  it("throws when the delete errors", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: new Error("boom") }));

    await expect(deleteWorkSession("session-1")).rejects.toThrow("boom");
  });
});
