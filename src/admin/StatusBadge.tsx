import { ACCOUNT_STATUS_LABEL, type AccountStatus } from "../domain/adminAccounts";

// An account's status in words, never colour alone.
export default function StatusBadge({ status }: { status: AccountStatus }) {
  const tone =
    status === "disabled"
      ? "border-destructive text-destructive"
      : status === "never_signed_in"
        ? "border-border text-muted-foreground"
        : "border-border text-foreground";
  return (
    <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${tone}`}>
      {ACCOUNT_STATUS_LABEL[status]}
    </span>
  );
}
