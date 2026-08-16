import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "../lib/supabase";
import {
  completeAllForAssignment,
  createWorkItems,
  deleteWorkItems,
  listWorkItems,
  listWorkItemsForStudent,
} from "./workItemService";

type QueryResult = { data: unknown; error: unknown };

function mockQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  const returnsBuilder = vi.fn(() => builder);
  builder.select = returnsBuilder;
  builder.eq = returnsBuilder;
  builder.in = returnsBuilder;
  builder.order = returnsBuilder;
  builder.insert = returnsBuilder;
  builder.update = returnsBuilder;
  builder.delete = returnsBuilder;
  builder.is = returnsBuilder;
  builder.single = returnsBuilder;
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
  assignment_id: "a1",
  title: "Find three sources",
  effort_minutes: 20,
  completed_at: null,
  position: 0,
};

describe("listWorkItemsForStudent", () => {
  it("maps rows into WorkItem objects", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: [row], error: null }));

    const items = await listWorkItemsForStudent("student-1");

    expect(mockedFrom).toHaveBeenCalledWith("work_items");
    expect(items).toEqual([
      {
        id: "1",
        assignmentId: "a1",
        title: "Find three sources",
        effortMinutes: 20,
        completedAt: null,
        position: 0,
      },
    ]);
  });

  it("throws when the query errors", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({ data: null, error: new Error("boom") }),
    );

    await expect(listWorkItemsForStudent("student-1")).rejects.toThrow("boom");
  });
});

describe("listWorkItems", () => {
  it("maps rows for a single assignment", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: [row], error: null }));

    expect(await listWorkItems("a1")).toEqual([
      {
        id: "1",
        assignmentId: "a1",
        title: "Find three sources",
        effortMinutes: 20,
        completedAt: null,
        position: 0,
      },
    ]);
  });
});

describe("createWorkItems", () => {
  it("bulk-inserts and returns the created work items", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: [row], error: null }));

    const items = await createWorkItems("student-1", [
      { assignmentId: "a1", title: "Find three sources", effortMinutes: 20, position: 0 },
    ]);

    expect(items).toEqual([
      {
        id: "1",
        assignmentId: "a1",
        title: "Find three sources",
        effortMinutes: 20,
        completedAt: null,
        position: 0,
      },
    ]);
  });

  it("returns an empty array without calling the database for an empty list", async () => {
    const items = await createWorkItems("student-1", []);

    expect(items).toEqual([]);
    expect(mockedFrom).not.toHaveBeenCalled();
  });

  it("throws when the insert errors", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({ data: null, error: new Error("boom") }),
    );

    await expect(
      createWorkItems("student-1", [
        { assignmentId: "a1", title: "Find three sources", effortMinutes: 20, position: 0 },
      ]),
    ).rejects.toThrow("boom");
  });
});

describe("deleteWorkItems", () => {
  it("deletes the given work items", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: null }));

    await expect(deleteWorkItems(["1", "2"])).resolves.toBeUndefined();
  });

  it("is a no-op for an empty list", async () => {
    await deleteWorkItems([]);

    expect(mockedFrom).not.toHaveBeenCalled();
  });

  it("throws when the delete errors", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({ data: null, error: new Error("boom") }),
    );

    await expect(deleteWorkItems(["1"])).rejects.toThrow("boom");
  });
});

describe("completeAllForAssignment", () => {
  it("completes open work items for the assignment", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: null }));

    await expect(completeAllForAssignment("a1")).resolves.toBeUndefined();
  });

  it("throws when the update errors", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({ data: null, error: new Error("boom") }),
    );

    await expect(completeAllForAssignment("a1")).rejects.toThrow("boom");
  });
});
