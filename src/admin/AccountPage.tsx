import { useState } from "react";
import { Button } from "@/components/ui/button";
import ResponsiveSheet from "@/components/ResponsiveSheet";
import ErrorBanner from "../components/ErrorBanner";
import { formatAdminDate, roleLabels } from "../domain/adminAccounts";
import {
  ALL_CATEGORIES,
  CLEAR_CATEGORIES,
  isAllCategories,
  removalLines,
  type ClearCategory,
} from "../domain/adminClearing";
import type { AdminActionRecord, SupportLink } from "../services/adminService";
import ClearDataSheet from "./ClearDataSheet";
import StatusBadge from "./StatusBadge";
import { useAdminAccount } from "./useAdminAccount";

// One account (docs/features/admin-account-management-v0.1.md,
// requirement 2): its details and support relationships, turning it off or
// on (A3), clearing its data (requirement 3), and the record of what
// admins have done to it (A4).

const ROLE_LABEL: Record<SupportLink["role"], string> = { coach: "Coach", parent_guardian: "Parent" };

function describeAction(action: AdminActionRecord): string {
  if (action.action === "disable") return "Turned off";
  if (action.action === "enable") return "Turned back on";
  const labels = action.categories.length === ALL_CATEGORIES.length && isAllCategories(action.categories)
    ? "all data"
    : CLEAR_CATEGORIES.filter((c) => action.categories.includes(c.id)).map((c) => c.label.toLowerCase()).join(", ");
  return `Cleared ${labels}${action.alsoDisabled ? ", and turned off" : ""}`;
}

export default function AccountPage({ userId, meId, onBack }: { userId: string; meId: string; onBack: () => void }) {
  const { detail, loading, loadError, retry, actionError, setDisabled, clear } = useAdminAccount(userId);
  const [confirmingStatus, setConfirmingStatus] = useState(false);
  const [chosen, setChosen] = useState<ClearCategory[]>([]);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (loadError || !detail) {
    return (
      <div>
        <Button variant="ghost" onClick={onBack} className="mb-3 -ml-3 px-3">
          ← All accounts
        </Button>
        <ErrorBanner message="Couldn’t load this account." onRetry={retry} />
      </div>
    );
  }

  const { account, asStudent, asSupporter, actions } = detail;
  const isSelf = account.id === meId;
  // Another admin is shown but can't be changed here (A6); you can clear
  // your own data (Q2) but not turn yourself off.
  const protectedAdmin = account.isAdmin && !isSelf;
  const disabled = account.status === "disabled";

  function toggle(category: ClearCategory) {
    setChosen((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  }

  async function confirmStatus() {
    setBusy(true);
    const ok = await setDisabled(!disabled);
    setBusy(false);
    if (ok) {
      setConfirmingStatus(false);
      setLastResult(disabled ? "The account is turned back on." : "The account is turned off.");
    }
  }

  async function confirmClear(alsoDisable: boolean) {
    setBusy(true);
    const result = await clear(chosen, alsoDisable);
    setBusy(false);
    if (!result) return;
    setConfirmingClear(false);
    setChosen([]);
    const lines = removalLines(result.removed);
    setLastResult(
      `${lines.length > 0 ? `Cleared: ${lines.join(", ")}.` : "There was nothing to clear."}${
        result.disabled ? " The account is turned off." : ""
      }`,
    );
  }

  return (
    <div className="max-w-3xl">
      <Button variant="ghost" onClick={onBack} className="mb-3 -ml-3 px-3">
        ← All accounts
      </Button>

      <h1 className="mb-2 break-all text-[clamp(1.4rem,5vw,1.9rem)] leading-tight">{account.email}</h1>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <StatusBadge status={account.status} />
        <span>{roleLabels(account).join(", ")}</span>
        {isSelf && <span>· This is your account</span>}
      </div>

      <div aria-live="polite">
        {lastResult && (
          <p className="mb-4 rounded-lg border border-border bg-card p-3 text-sm text-card-foreground">{lastResult}</p>
        )}
      </div>
      {actionError && <ErrorBanner message={actionError} className="mb-4" />}

      <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Created</dt>
          <dd>{formatAdminDate(account.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Last sign-in</dt>
          <dd>{formatAdminDate(account.lastSignInAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Courses</dt>
          <dd>{account.courseCount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Assignments</dt>
          <dd>{account.assignmentCount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Planned sessions</dt>
          <dd>{account.plannedSessionCount}</dd>
        </div>
      </dl>

      {(asStudent.length > 0 || asSupporter.length > 0) && (
        <section className="mb-6">
          <h2 className="mb-2 text-base font-semibold">Support relationships</h2>
          {asStudent.length > 0 && (
            <>
              <h3 className="mb-1 text-sm text-muted-foreground">Their supporters</h3>
              <ul className="mb-3 text-sm">
                {asStudent.map((link) => (
                  <li key={link.id} className="break-all">
                    {link.otherEmail} · {ROLE_LABEL[link.role]} · {link.status}
                  </li>
                ))}
              </ul>
            </>
          )}
          {asSupporter.length > 0 && (
            <>
              <h3 className="mb-1 text-sm text-muted-foreground">Students they support</h3>
              <ul className="text-sm">
                {asSupporter.map((link) => (
                  <li key={link.id} className="break-all">
                    {link.otherEmail} · {ROLE_LABEL[link.role]} · {link.status}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <section className="mb-6">
        <h2 className="mb-2 text-base font-semibold">Account</h2>
        {protectedAdmin ? (
          <p className="text-sm text-muted-foreground">Admin accounts can’t be changed here.</p>
        ) : isSelf ? (
          <p className="text-sm text-muted-foreground">You can’t turn off your own account.</p>
        ) : (
          <Button variant={disabled ? "outline" : "destructive"} onClick={() => setConfirmingStatus(true)}>
            {disabled ? "Turn this account back on" : "Turn off this account"}
          </Button>
        )}
      </section>

      {!protectedAdmin && (
        <section className="mb-6">
          <h2 className="mb-2 text-base font-semibold">Clear data</h2>
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-2 text-sm text-muted-foreground">
              The account stays; only the data you choose is removed.
            </legend>
            <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                className="size-5 accent-primary"
                checked={isAllCategories(chosen)}
                onChange={(event) => setChosen(event.target.checked ? [...ALL_CATEGORIES] : [])}
              />
              All data
            </label>
            {CLEAR_CATEGORIES.map((category) => (
              <label key={category.id} className="flex min-h-11 items-start gap-3 py-1 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 size-5 shrink-0 accent-primary"
                  checked={chosen.includes(category.id)}
                  onChange={() => toggle(category.id)}
                />
                <span>
                  {category.label}
                  {category.alsoRemoves && (
                    <span className="block text-xs text-muted-foreground">Also removes {category.alsoRemoves}.</span>
                  )}
                </span>
              </label>
            ))}
          </fieldset>
          <Button
            variant="outline"
            className="mt-3"
            disabled={chosen.length === 0}
            onClick={() => setConfirmingClear(true)}
          >
            Review what will be cleared
          </Button>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-base font-semibold">Admin record</h2>
        {actions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing yet.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {actions.map((action) => {
              const lines = removalLines(action.counts);
              return (
                <li key={action.id} className="rounded-lg border border-border bg-card p-3">
                  <p className="font-medium">{describeAction(action)}</p>
                  {lines.length > 0 && <p className="text-muted-foreground">{lines.join(", ")}</p>}
                  <p className="text-xs text-muted-foreground">
                    {new Date(action.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {action.adminEmail && ` · by ${action.adminEmail}`}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ResponsiveSheet
        open={confirmingStatus}
        onOpenChange={setConfirmingStatus}
        title={disabled ? "Turn this account back on?" : "Turn off this account?"}
        description={
          disabled
            ? `${account.email} will be able to sign in again, with all their data as it was.`
            : `${account.email} won’t be able to sign in, and will be signed out within the hour. Their data stays.`
        }
      >
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            variant={disabled ? "default" : "destructive"}
            className="sm:flex-1"
            disabled={busy}
            onClick={confirmStatus}
          >
            {disabled ? "Turn back on" : "Turn off"}
          </Button>
          <Button variant="ghost" className="sm:flex-1" onClick={() => setConfirmingStatus(false)}>
            Cancel
          </Button>
        </div>
      </ResponsiveSheet>

      <ClearDataSheet
        open={confirmingClear}
        userId={account.id}
        email={account.email}
        categories={chosen}
        canAlsoTurnOff={!disabled && !isSelf}
        busy={busy}
        onConfirm={confirmClear}
        onClose={() => setConfirmingClear(false)}
      />
    </div>
  );
}
