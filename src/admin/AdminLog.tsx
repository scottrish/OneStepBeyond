import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ErrorBanner from "../components/ErrorBanner";
import { ADMIN_ACTION_LABEL, describeAdminAction, type AdminActionKind } from "../domain/adminAccounts";
import { removalLines } from "../domain/adminClearing";
import { LOG_ENTRIES_PER_PAGE, type AdminLogEntry, type AdminLogQuery } from "../services/adminService";
import { useAdminLog, useLogAdmins } from "./useAdminLog";

// Every admin action across all accounts, newest first
// (docs/features/admin-action-log-v0.1.md): filter by action, admin,
// account and dates; open an entry's account. A table from sm:, a stacked
// list on phones.

const SELECT =
  "h-12 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring sm:h-11";

const DELETED = "Deleted account";

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminLog({
  query,
  onQueryChange,
  onOpenAccount,
}: {
  query: AdminLogQuery;
  onQueryChange: (query: AdminLogQuery) => void;
  onOpenAccount: (userId: string) => void;
}) {
  const { data, loading, loadError, retry } = useAdminLog(query);
  const { data: admins } = useLogAdmins();
  const [searchText, setSearchText] = useState(query.accountSearch);

  const update = (patch: Partial<AdminLogQuery>) => onQueryChange({ ...query, page: 0, ...patch });

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    update({ accountSearch: searchText });
  }

  const { entries, total } = data;
  const from = total === 0 ? 0 : query.page * LOG_ENTRIES_PER_PAGE + 1;
  const to = Math.min(total, (query.page + 1) * LOG_ENTRIES_PER_PAGE);
  const filtered =
    query.action !== null || query.adminId !== null || query.accountSearch !== "" || query.fromDay !== "" || query.toDay !== "";

  return (
    <div>
      <h1 className="mb-4 text-[clamp(1.65rem,5vw,2.1rem)] leading-tight">Admin log</h1>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2" role="search">
          <label htmlFor="log-account-search" className="sr-only">
            Search by account email
          </label>
          <Input
            id="log-account-search"
            type="search"
            placeholder="Search by account email"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <label className="flex flex-col gap-1 text-sm">
          Action
          <select
            className={SELECT}
            value={query.action ?? ""}
            onChange={(event) => update({ action: (event.target.value || null) as AdminActionKind | null })}
          >
            <option value="">Any</option>
            {(Object.keys(ADMIN_ACTION_LABEL) as AdminActionKind[]).map((kind) => (
              <option key={kind} value={kind}>
                {ADMIN_ACTION_LABEL[kind]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Admin
          <select
            className={SELECT}
            value={query.adminId ?? ""}
            onChange={(event) => update({ adminId: event.target.value || null })}
          >
            <option value="">Any</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.email ?? DELETED}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          From
          <input
            type="date"
            className={SELECT}
            value={query.fromDay}
            onChange={(event) => update({ fromDay: event.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          To
          <input
            type="date"
            className={SELECT}
            value={query.toDay}
            onChange={(event) => update({ toDay: event.target.value })}
          />
        </label>
      </div>

      {loadError && <ErrorBanner message="Couldn’t load the admin log." onRetry={retry} className="mb-4" />}
      {loading && <p className="text-muted-foreground">Loading…</p>}

      {!loading && !loadError && (
        <>
          <p className="mb-2 text-sm text-muted-foreground" aria-live="polite">
            {total === 0
              ? filtered
                ? "No admin actions match."
                : "No admin actions yet."
              : `Showing ${from}–${to} of ${total}`}
          </p>

          {/* sm: and up: a table, always newest first. */}
          {entries.length > 0 && (
            <table className="hidden w-full border-collapse text-sm sm:table">
              <caption className="sr-only">Admin actions, newest first</caption>
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium">
                    When
                  </th>
                  <th scope="col" className="px-3 py-2 text-left font-medium">
                    Admin
                  </th>
                  <th scope="col" className="px-3 py-2 text-left font-medium">
                    Account
                  </th>
                  <th scope="col" className="px-3 py-2 text-left font-medium">
                    What
                  </th>
                  <th scope="col" className="px-3 py-2 text-left font-medium">
                    Removed
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border align-top">
                    <td className="whitespace-nowrap px-3 py-3">{when(entry.createdAt)}</td>
                    <td className="break-all px-3 py-3">{entry.adminEmail ?? DELETED}</td>
                    <td className="px-3 py-1">
                      <AccountLink entry={entry} onOpen={onOpenAccount} />
                    </td>
                    <td className="px-3 py-3">{describeAdminAction(entry)}</td>
                    <td className="px-3 py-3 text-muted-foreground">{removalLines(entry.counts).join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Phones: a stacked list. */}
          <ul className="flex flex-col gap-2 sm:hidden">
            {entries.map((entry) => {
              const removed = removalLines(entry.counts);
              return (
                <li key={entry.id} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm">
                  <p className="font-medium">{describeAdminAction(entry)}</p>
                  <AccountLink entry={entry} onOpen={onOpenAccount} />
                  {removed.length > 0 && <p className="text-muted-foreground">{removed.join(", ")}</p>}
                  <p className="text-xs text-muted-foreground">
                    {when(entry.createdAt)} · by {entry.adminEmail ?? DELETED}
                  </p>
                </li>
              );
            })}
          </ul>

          {total > LOG_ENTRIES_PER_PAGE && (
            <div className="mt-4 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                disabled={query.page === 0}
                onClick={() => onQueryChange({ ...query, page: query.page - 1 })}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={to >= total}
                onClick={() => onQueryChange({ ...query, page: query.page + 1 })}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// The account an action was taken on: a link to its page, or "Deleted
// account" once it's gone.
function AccountLink({ entry, onOpen }: { entry: AdminLogEntry; onOpen: (userId: string) => void }) {
  return entry.targetEmail === null ? (
    <span className="text-muted-foreground">{DELETED}</span>
  ) : (
    <button
      type="button"
      onClick={() => onOpen(entry.targetUserId)}
      className="min-h-11 break-all rounded-md text-left font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
    >
      {entry.targetEmail}
    </button>
  );
}

