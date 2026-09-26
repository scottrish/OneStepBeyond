import { CLEAR_CATEGORIES, isAllCategories, type ClearCategory } from "./adminClearing";

// Account status and role wording for the admin page
// (docs/features/admin-account-management-v0.1.md), and what a turned-off
// account is told when it tries to sign in (A3).

export type AccountStatus = "active" | "disabled" | "never_signed_in";

export const ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = {
  active: "Active",
  disabled: "Disabled",
  never_signed_in: "Never signed in",
};

export type AccountRoles = { isStudent: boolean; isSupporter: boolean; isAdmin: boolean };

/** "Student", "Supporter", "Admin" — or "No data yet" for an account with none of them. */
export function roleLabels({ isStudent, isSupporter, isAdmin }: AccountRoles): string[] {
  const labels = [isStudent && "Student", isSupporter && "Supporter", isAdmin && "Admin"].filter(
    (label): label is string => typeof label === "string",
  );
  return labels.length > 0 ? labels : ["No data yet"];
}

// Signing in to an account an admin turned off (the auth server's
// `user_banned` error).
export const ACCOUNT_TURNED_OFF =
  "This account has been turned off. Ask your teacher or the app’s administrator.";

export function signInErrorMessage(error: { code?: string; message: string }): string {
  return error.code === "user_banned" ? ACCOUNT_TURNED_OFF : error.message;
}

/** "Sep 26, 2026", or "—" when there's no date (e.g. never signed in). */
export function formatAdminDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ——— The admin record and the admin log (admin-action-log-v0.1.md) ———

export type AdminActionKind = "disable" | "enable" | "clear";

export const ADMIN_ACTION_LABEL: Record<AdminActionKind, string> = {
  disable: "Turned off",
  enable: "Turned back on",
  clear: "Cleared data",
};

/**
 * One admin action in words — the same on an account's page and in the
 * admin log (G1): "Turned off", "Turned back on", "Cleared plans (keeps
 * assignments and steps)", "Cleared all data", "Cleared all data and
 * turned off".
 */
export function describeAdminAction(action: {
  action: AdminActionKind;
  categories: ClearCategory[];
  alsoDisabled: boolean;
}): string {
  if (action.action !== "clear") return ADMIN_ACTION_LABEL[action.action];
  if (isAllCategories(action.categories)) {
    return action.alsoDisabled ? "Cleared all data and turned off" : "Cleared all data";
  }
  const labels = CLEAR_CATEGORIES.filter((category) => action.categories.includes(category.id))
    .map((category) => category.label.toLowerCase())
    .join(", ");
  return `Cleared ${labels}`;
}

function localDay(date: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}

/**
 * The log's date filter (G2): "from" and "to" are the viewer's own
 * calendar days, both inclusive — from the start of "from" to the start of
 * the day after "to" (exclusive). Either can be left empty.
 */
export function dateRangeBounds(from: string, to: string): { from: string | null; to: string | null } {
  const start = localDay(from);
  const end = localDay(to);
  if (end) end.setDate(end.getDate() + 1);
  return { from: start ? start.toISOString() : null, to: end ? end.toISOString() : null };
}
