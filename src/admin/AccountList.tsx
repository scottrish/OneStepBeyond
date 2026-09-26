import { useState, type FormEvent } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ErrorBanner from "../components/ErrorBanner";
import { formatAdminDate as formatDate, roleLabels, type AccountStatus } from "../domain/adminAccounts";
import {
  ACCOUNTS_PER_PAGE,
  type AccountQuery,
  type AccountRoleFilter,
  type AccountSort,
  type AdminAccount,
} from "../services/adminService";
import StatusBadge from "./StatusBadge";
import { useAdminAccounts } from "./useAdminAccounts";

// Every account, searchable, filterable, sortable and paged
// (docs/features/admin-account-management-v0.1.md, requirement 1). A
// table from sm:, a stacked list on phones.

const SELECT =
  "h-12 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring sm:h-11";

type Column = { label: string; asc: AccountSort; desc: AccountSort };
const SORTABLE: Record<"email" | "created" | "lastSignIn", Column> = {
  email: { label: "Email", asc: "email_asc", desc: "email_desc" },
  created: { label: "Created", asc: "created_asc", desc: "created_desc" },
  lastSignIn: { label: "Last sign-in", asc: "last_sign_in_asc", desc: "last_sign_in_desc" },
};

export default function AccountList({
  query,
  onQueryChange,
  onOpen,
}: {
  query: AccountQuery;
  onQueryChange: (query: AccountQuery) => void;
  onOpen: (userId: string) => void;
}) {
  const { data, loading, loadError, retry } = useAdminAccounts(query);
  const [searchText, setSearchText] = useState(query.search);

  const update = (patch: Partial<AccountQuery>) => onQueryChange({ ...query, page: 0, ...patch });

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    update({ search: searchText });
  }

  const { accounts, total } = data;
  const from = total === 0 ? 0 : query.page * ACCOUNTS_PER_PAGE + 1;
  const to = Math.min(total, (query.page + 1) * ACCOUNTS_PER_PAGE);

  return (
    <div>
      <h1 className="mb-4 text-[clamp(1.65rem,5vw,2.1rem)] leading-tight">Accounts</h1>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2" role="search">
          <label htmlFor="account-search" className="sr-only">
            Search by email
          </label>
          <Input
            id="account-search"
            type="search"
            placeholder="Search by email"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <label className="flex flex-col gap-1 text-sm">
          Status
          <select
            className={SELECT}
            value={query.status ?? ""}
            onChange={(event) => update({ status: (event.target.value || null) as AccountStatus | null })}
          >
            <option value="">Any</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
            <option value="never_signed_in">Never signed in</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Role
          <select
            className={SELECT}
            value={query.role ?? ""}
            onChange={(event) => update({ role: (event.target.value || null) as AccountRoleFilter | null })}
          >
            <option value="">Any</option>
            <option value="student">Student</option>
            <option value="supporter">Supporter</option>
            <option value="admin">Admin</option>
            <option value="none">No data yet</option>
          </select>
        </label>
        {/* Phones have no column headers to tap, so sorting is a select. */}
        <label className="flex flex-col gap-1 text-sm sm:hidden">
          Sort
          <select
            className={SELECT}
            value={query.sort}
            onChange={(event) => update({ sort: event.target.value as AccountSort })}
          >
            <option value="created_desc">Newest first</option>
            <option value="created_asc">Oldest first</option>
            <option value="email_asc">Email A–Z</option>
            <option value="email_desc">Email Z–A</option>
            <option value="last_sign_in_desc">Signed in most recently</option>
          </select>
        </label>
      </div>

      {loadError && <ErrorBanner message="Couldn’t load the accounts." onRetry={retry} className="mb-4" />}
      {loading && <p className="text-muted-foreground">Loading…</p>}

      {!loading && !loadError && (
        <>
          <p className="mb-2 text-sm text-muted-foreground" aria-live="polite">
            {total === 0 ? "No accounts match." : `Showing ${from}–${to} of ${total}`}
          </p>

          {/* sm: and up: a table. */}
          <table className="hidden w-full border-collapse text-sm sm:table">
            <caption className="sr-only">Accounts</caption>
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <SortHeader column={SORTABLE.email} sort={query.sort} onSort={(sort) => update({ sort })} />
                <th scope="col" className="px-3 py-2 text-left font-medium">
                  Status
                </th>
                <th scope="col" className="px-3 py-2 text-left font-medium">
                  Roles
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Courses
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Assignments
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Planned
                </th>
                <SortHeader column={SORTABLE.created} sort={query.sort} onSort={(sort) => update({ sort })} />
                <SortHeader column={SORTABLE.lastSignIn} sort={query.sort} onSort={(sort) => update({ sort })} />
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b border-border">
                  <td className="px-3 py-1">
                    <button
                      type="button"
                      onClick={() => onOpen(account.id)}
                      className="min-h-11 rounded-md text-left font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
                    >
                      {account.email}
                    </button>
                  </td>
                  <td className="px-3 py-1">
                    <StatusBadge status={account.status} />
                  </td>
                  <td className="px-3 py-1">{roleLabels(account).join(", ")}</td>
                  <td className="px-3 py-1 text-right tabular-nums">{account.courseCount}</td>
                  <td className="px-3 py-1 text-right tabular-nums">{account.assignmentCount}</td>
                  <td className="px-3 py-1 text-right tabular-nums">{account.plannedSessionCount}</td>
                  <td className="px-3 py-1">{formatDate(account.createdAt)}</td>
                  <td className="px-3 py-1">{formatDate(account.lastSignInAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Phones: a stacked list. */}
          <ul className="flex flex-col gap-2 sm:hidden">
            {accounts.map((account) => (
              <li key={account.id}>
                <AccountCard account={account} onOpen={() => onOpen(account.id)} />
              </li>
            ))}
          </ul>

          {total > ACCOUNTS_PER_PAGE && (
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

function AccountCard({ account, onOpen }: { account: AdminAccount; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-11 w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{account.email}</span>
        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <StatusBadge status={account.status} />
          <span>{roleLabels(account).join(", ")}</span>
          <span>· last sign-in {formatDate(account.lastSignInAt)}</span>
        </span>
      </span>
      <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

function SortHeader({ column, sort, onSort }: { column: Column; sort: AccountSort; onSort: (sort: AccountSort) => void }) {
  const direction = sort === column.asc ? "ascending" : sort === column.desc ? "descending" : "none";
  const next = direction === "descending" ? column.asc : column.desc;
  return (
    <th scope="col" aria-sort={direction} className="px-3 py-2 text-left font-medium">
      <button
        type="button"
        onClick={() => onSort(next)}
        className="inline-flex min-h-11 items-center gap-1 rounded-md hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
      >
        {column.label}
        <span aria-hidden="true">{direction === "ascending" ? "▲" : direction === "descending" ? "▼" : ""}</span>
      </button>
    </th>
  );
}
