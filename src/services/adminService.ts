import { supabase } from "../lib/supabase";
import type { AccountStatus } from "../domain/adminAccounts";
import type { ClearCategory } from "../domain/adminClearing";

// The admin page's database calls (docs/features/admin-account-management-v0.1.md;
// supabase/migrations/20260926120000_admin_account_management.sql). Each
// one is a security-definer function that refuses anyone who isn't a
// superuser (A1) — this file only shapes the results. Nothing here is
// stored for offline use or queued: admin work needs a connection.

export type AdminAccount = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  status: AccountStatus;
  isStudent: boolean;
  isSupporter: boolean;
  isAdmin: boolean;
  courseCount: number;
  assignmentCount: number;
  plannedSessionCount: number;
};

export type AccountSort =
  | "created_desc"
  | "created_asc"
  | "email_asc"
  | "email_desc"
  | "last_sign_in_desc"
  | "last_sign_in_asc";

export type AccountRoleFilter = "student" | "supporter" | "admin" | "none";

export type AccountQuery = {
  search: string;
  status: AccountStatus | null;
  role: AccountRoleFilter | null;
  sort: AccountSort;
  page: number;
};

export const ACCOUNTS_PER_PAGE = 50;

type AccountRow = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  status: AccountStatus;
  is_student: boolean;
  is_supporter: boolean;
  is_admin: boolean;
  course_count: number;
  assignment_count: number;
  planned_session_count: number;
};

function toAccount(row: AccountRow): AdminAccount {
  return {
    id: row.id,
    email: row.email,
    createdAt: row.created_at,
    lastSignInAt: row.last_sign_in_at,
    status: row.status,
    isStudent: row.is_student,
    isSupporter: row.is_supporter,
    isAdmin: row.is_admin,
    courseCount: Number(row.course_count),
    assignmentCount: Number(row.assignment_count),
    plannedSessionCount: Number(row.planned_session_count),
  };
}

export async function listAccounts(query: AccountQuery): Promise<{ accounts: AdminAccount[]; total: number }> {
  const { data, error } = await supabase.rpc("admin_list_accounts", {
    p_search: query.search.trim() === "" ? null : query.search.trim(),
    p_status: query.status,
    p_role: query.role,
    p_sort: query.sort,
    p_limit: ACCOUNTS_PER_PAGE,
    p_offset: query.page * ACCOUNTS_PER_PAGE,
  });

  if (error) throw error;

  const rows = (data ?? []) as (AccountRow & { total_count: number })[];
  return { accounts: rows.map(toAccount), total: rows.length > 0 ? Number(rows[0]!.total_count) : 0 };
}

export type SupportLink = {
  id: string;
  role: "parent_guardian" | "coach";
  status: string;
  invitedAt: string;
  otherEmail: string;
};

export type AdminActionRecord = {
  id: string;
  action: "disable" | "enable" | "clear";
  categories: ClearCategory[];
  alsoDisabled: boolean;
  counts: Record<string, number>;
  createdAt: string;
  adminEmail: string | null;
};

export type AccountDetail = {
  account: AdminAccount;
  asStudent: SupportLink[];
  asSupporter: SupportLink[];
  actions: AdminActionRecord[];
};

type LinkRow = { id: string; role: SupportLink["role"]; status: string; invited_at: string; other_email: string };
type ActionRow = {
  id: string;
  action: AdminActionRecord["action"];
  categories: ClearCategory[];
  also_disabled: boolean;
  counts: Record<string, number>;
  created_at: string;
  admin_email: string | null;
};

function toLink(row: LinkRow): SupportLink {
  return { id: row.id, role: row.role, status: row.status, invitedAt: row.invited_at, otherEmail: row.other_email };
}

export async function getAccount(userId: string): Promise<AccountDetail> {
  const { data, error } = await supabase.rpc("admin_get_account", { p_user: userId });

  if (error) throw error;

  const detail = data as { account: AccountRow; as_student: LinkRow[]; as_supporter: LinkRow[]; actions: ActionRow[] };
  return {
    account: toAccount(detail.account),
    asStudent: detail.as_student.map(toLink),
    asSupporter: detail.as_supporter.map(toLink),
    actions: detail.actions.map((row) => ({
      id: row.id,
      action: row.action,
      categories: row.categories,
      alsoDisabled: row.also_disabled,
      counts: row.counts,
      createdAt: row.created_at,
      adminEmail: row.admin_email,
    })),
  };
}

/** Turn an account off (A3) or back on. */
export async function setAccountDisabled(userId: string, disabled: boolean): Promise<void> {
  const { error } = await supabase.rpc("admin_set_disabled", { p_user: userId, p_disabled: disabled });

  if (error) throw error;
}

/** What clearing would remove, per table — nothing is removed. */
export async function previewClear(userId: string, categories: ClearCategory[]): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc("admin_clear_preview", { p_user: userId, p_categories: categories });

  if (error) throw error;
  return (data ?? {}) as Record<string, number>;
}

/** Clear, and optionally turn the account off, all or nothing (A5). */
export async function clearAccount(
  userId: string,
  categories: ClearCategory[],
  alsoDisable: boolean,
): Promise<{ removed: Record<string, number>; disabled: boolean }> {
  const { data, error } = await supabase.rpc("admin_clear_account", {
    p_user: userId,
    p_categories: categories,
    p_also_disable: alsoDisable,
  });

  if (error) throw error;
  return data as { removed: Record<string, number>; disabled: boolean };
}

// ——— The admin log (admin-action-log-v0.1.md) ———

export type AdminLogEntry = AdminActionRecord & {
  adminId: string;
  targetUserId: string;
  // Null once the account has been deleted: entries outlive accounts.
  targetEmail: string | null;
};

export type AdminLogQuery = {
  action: AdminActionRecord["action"] | null;
  adminId: string | null;
  accountSearch: string;
  // The viewer's own days, "YYYY-MM-DD", or "" for open-ended.
  fromDay: string;
  toDay: string;
  page: number;
};

export const LOG_ENTRIES_PER_PAGE = 50;

type LogRow = ActionRow & { admin_id: string; target_user_id: string; target_email: string | null; total_count: number };

/** A page of every admin action, newest first. `from`/`to` are ISO bounds (see dateRangeBounds). */
export async function listActions(
  query: AdminLogQuery,
  bounds: { from: string | null; to: string | null },
): Promise<{ entries: AdminLogEntry[]; total: number }> {
  const { data, error } = await supabase.rpc("admin_list_actions", {
    p_action: query.action,
    p_admin_id: query.adminId,
    p_account_search: query.accountSearch.trim() === "" ? null : query.accountSearch.trim(),
    p_from: bounds.from,
    p_to: bounds.to,
    p_limit: LOG_ENTRIES_PER_PAGE,
    p_offset: query.page * LOG_ENTRIES_PER_PAGE,
  });

  if (error) throw error;

  const rows = (data ?? []) as LogRow[];
  return {
    entries: rows.map((row) => ({
      id: row.id,
      action: row.action,
      categories: row.categories,
      alsoDisabled: row.also_disabled,
      counts: row.counts,
      createdAt: row.created_at,
      adminEmail: row.admin_email,
      adminId: row.admin_id,
      targetUserId: row.target_user_id,
      targetEmail: row.target_email,
    })),
    total: rows.length > 0 ? Number(rows[0]!.total_count) : 0,
  };
}

/** The admins who appear in the log (email null if their account is gone), for the Admin filter. */
export async function listLogAdmins(): Promise<{ id: string; email: string | null }[]> {
  const { data, error } = await supabase.rpc("admin_list_log_admins");

  if (error) throw error;
  return ((data ?? []) as { admin_id: string; admin_email: string | null }[]).map((row) => ({
    id: row.admin_id,
    email: row.admin_email,
  }));
}
