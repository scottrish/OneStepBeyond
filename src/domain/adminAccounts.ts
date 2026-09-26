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
