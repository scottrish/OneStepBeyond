import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({ supabase: { rpc: vi.fn() } }));

import { supabase } from "../lib/supabase";
import {
  ACCOUNTS_PER_PAGE,
  clearAccount,
  getAccount,
  listAccounts,
  previewClear,
  setAccountDisabled,
} from "./adminService";

const rpc = supabase.rpc as unknown as ReturnType<typeof vi.fn>;

const row = {
  id: "u1",
  email: "student@example.com",
  created_at: "2026-09-01T00:00:00Z",
  last_sign_in_at: null,
  status: "never_signed_in",
  is_student: true,
  is_supporter: false,
  is_admin: false,
  course_count: 2,
  assignment_count: 5,
  planned_session_count: 3,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("adminService (admin-account-management-v0.1.md)", () => {
  it("lists a page of accounts with the total, passing search, filters, sort and offset", async () => {
    rpc.mockResolvedValue({ data: [{ ...row, total_count: 120 }], error: null });

    const result = await listAccounts({ search: "  stud ", status: "active", role: "student", sort: "email_asc", page: 2 });

    expect(rpc).toHaveBeenCalledWith("admin_list_accounts", {
      p_search: "stud",
      p_status: "active",
      p_role: "student",
      p_sort: "email_asc",
      p_limit: ACCOUNTS_PER_PAGE,
      p_offset: 2 * ACCOUNTS_PER_PAGE,
    });
    expect(result.total).toBe(120);
    expect(result.accounts[0]).toMatchObject({
      email: "student@example.com",
      status: "never_signed_in",
      isStudent: true,
      courseCount: 2,
      plannedSessionCount: 3,
    });
  });

  it("an empty search is no search, and no rows is a total of 0", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    const result = await listAccounts({ search: " ", status: null, role: null, sort: "created_desc", page: 0 });
    expect(rpc.mock.calls[0]![1]).toMatchObject({ p_search: null, p_offset: 0 });
    expect(result).toEqual({ accounts: [], total: 0 });
  });

  it("one account, with its relationships and record", async () => {
    rpc.mockResolvedValue({
      data: {
        account: row,
        as_student: [{ id: "r1", role: "coach", status: "active", invited_at: "t", other_email: "coach@example.com" }],
        as_supporter: [],
        actions: [
          {
            id: "a1",
            action: "clear",
            categories: ["plans"],
            also_disabled: false,
            counts: { work_sessions: 2 },
            created_at: "t",
            admin_email: "admin@example.com",
          },
        ],
      },
      error: null,
    });

    const detail = await getAccount("u1");

    expect(rpc).toHaveBeenCalledWith("admin_get_account", { p_user: "u1" });
    expect(detail.asStudent[0]).toMatchObject({ otherEmail: "coach@example.com", role: "coach" });
    expect(detail.actions[0]).toMatchObject({ action: "clear", alsoDisabled: false, adminEmail: "admin@example.com" });
  });

  it("turning off, previewing and clearing call their functions", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await setAccountDisabled("u1", true);
    expect(rpc).toHaveBeenLastCalledWith("admin_set_disabled", { p_user: "u1", p_disabled: true });

    rpc.mockResolvedValue({ data: { courses: 1 }, error: null });
    expect(await previewClear("u1", ["courses"])).toEqual({ courses: 1 });
    expect(rpc).toHaveBeenLastCalledWith("admin_clear_preview", { p_user: "u1", p_categories: ["courses"] });

    rpc.mockResolvedValue({ data: { removed: { courses: 1 }, disabled: true }, error: null });
    expect(await clearAccount("u1", ["courses"], true)).toEqual({ removed: { courses: 1 }, disabled: true });
    expect(rpc).toHaveBeenLastCalledWith("admin_clear_account", {
      p_user: "u1",
      p_categories: ["courses"],
      p_also_disable: true,
    });
  });

  it("passes on the database's refusal", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "This is for administrators only.", code: "42501" } });
    await expect(setAccountDisabled("u1", true)).rejects.toMatchObject({ code: "42501" });
  });
});
