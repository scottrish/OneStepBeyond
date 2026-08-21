import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("../lib/invitationToken", () => ({
  generateInvitationToken: vi.fn(() => "raw-token"),
  hashInvitationToken: vi.fn(async (token: string) => `hash-of-${token}`),
}));

import { supabase } from "../lib/supabase";
import {
  acceptInvitation,
  createInvitation,
  declineInvitation,
  findInvitationByToken,
  listActiveRelationshipsForSupporter,
  listRelationshipsForStudent,
} from "./supportRelationshipService";

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
  builder.single = () => Promise.resolve(result);
  builder.maybeSingle = () => Promise.resolve(result);
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

describe("listRelationshipsForStudent", () => {
  it("queries support_relationships scoped to the student, newest first, and maps rows", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({
        data: [
          {
            id: "r1",
            invited_email: "coach@example.com",
            role: "coach",
            status: "pending",
            invited_at: "2026-08-19T00:00:00Z",
          },
        ],
        error: null,
      }),
    );

    const relationships = await listRelationshipsForStudent("student-1");

    expect(mockedFrom).toHaveBeenCalledWith("support_relationships");
    expect(relationships).toEqual([
      {
        id: "r1",
        invitedEmail: "coach@example.com",
        role: "coach",
        status: "pending",
        invitedAt: "2026-08-19T00:00:00Z",
      },
    ]);
  });
});

describe("createInvitation", () => {
  it("hashes the generated token before storing, and returns the raw token to the caller", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: { id: "r1" }, error: null }));

    const result = await createInvitation({
      studentId: "student-1",
      invitedEmail: "coach@example.com",
      role: "coach",
    });

    expect(result).toEqual({ relationshipId: "r1", rawToken: "raw-token" });
    const builder = mockedFrom.mock.results[0]!.value;
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: "student-1",
        invited_email: "coach@example.com",
        role: "coach",
        status: "pending",
        invited_by: "student",
        token_hash: "hash-of-raw-token",
      }),
    );
    // The raw token is never sent to Postgres — only its hash.
    const insertedRow = builder.insert.mock.calls[0][0];
    expect(insertedRow.token_hash).not.toEqual("raw-token");
  });

  it("throws on a query error", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: { message: "boom" } }));

    await expect(
      createInvitation({ studentId: "student-1", invitedEmail: "coach@example.com", role: "coach" }),
    ).rejects.toEqual({ message: "boom" });
  });
});

describe("findInvitationByToken", () => {
  it("hashes the raw token and queries by the hash", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({ data: { id: "r1", invited_email: "coach@example.com", role: "coach" }, error: null }),
    );

    const invitation = await findInvitationByToken("raw-token");

    expect(invitation).toEqual({ id: "r1", invitedEmail: "coach@example.com", role: "coach" });
    const builder = mockedFrom.mock.results[0]!.value;
    expect(builder.eq).toHaveBeenCalledWith("token_hash", "hash-of-raw-token");
  });

  // RLS returning nothing for a wrong token, wrong email, expired, or
  // already-used invitation are all indistinguishable here by design —
  // see the function's own comment.
  it("returns null rather than throwing when RLS returns no row", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: null }));

    expect(await findInvitationByToken("raw-token")).toBeNull();
  });
});

describe("acceptInvitation", () => {
  it("updates status, supporter_id, and accepted_at", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: null }));

    await acceptInvitation("r1", "supporter-1");

    const builder = mockedFrom.mock.results[0]!.value;
    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "active", supporter_id: "supporter-1" }),
    );
    expect(builder.eq).toHaveBeenCalledWith("id", "r1");
  });
});

describe("declineInvitation", () => {
  it("updates status to declined only", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: null }));

    await declineInvitation("r1");

    const builder = mockedFrom.mock.results[0]!.value;
    expect(builder.update).toHaveBeenCalledWith({ status: "declined" });
  });
});
