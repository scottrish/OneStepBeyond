import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../services/adminService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../services/adminService")>()),
  listAccounts: vi.fn(),
}));

import { listAccounts, type AccountQuery, type AdminAccount } from "../services/adminService";
import AccountList from "./AccountList";

const account = (patch: Partial<AdminAccount>): AdminAccount => ({
  id: "u1",
  email: "student@example.com",
  createdAt: "2026-09-01T12:00:00Z",
  lastSignInAt: "2026-09-20T12:00:00Z",
  status: "active",
  isStudent: true,
  isSupporter: false,
  isAdmin: false,
  courseCount: 2,
  assignmentCount: 5,
  plannedSessionCount: 3,
  ...patch,
});

const query: AccountQuery = { search: "", status: null, role: null, sort: "created_desc", page: 0 };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listAccounts).mockResolvedValue({
    accounts: [
      account({}),
      account({ id: "u2", email: "coach@example.com", status: "disabled", isStudent: false, isSupporter: true }),
      account({ id: "u3", email: "new@example.com", status: "never_signed_in", isStudent: false, lastSignInAt: null }),
    ],
    total: 3,
  });
});

describe("AccountList (admin-account-management-v0.1.md, requirement 1)", () => {
  it("every account, with status in words, roles and counts", async () => {
    render(<AccountList query={query} onQueryChange={vi.fn()} onOpen={vi.fn()} />);
    const table = await screen.findByRole("table", { name: "Accounts" });

    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(4);
    expect(rows[1]).toHaveTextContent(/student@example.com\s*Active\s*Student\s*2\s*5\s*3/);
    expect(rows[2]).toHaveTextContent(/coach@example.com\s*Disabled\s*Supporter/);
    expect(rows[3]).toHaveTextContent(/new@example.com\s*Never signed in\s*No data yet.*—/);
    expect(screen.getByText("Showing 1–3 of 3")).toBeInTheDocument();
  });

  it("opens an account", async () => {
    const onOpen = vi.fn();
    render(<AccountList query={query} onQueryChange={vi.fn()} onOpen={onOpen} />);
    const table = await screen.findByRole("table", { name: "Accounts" });
    await userEvent.click(within(table).getByRole("button", { name: "coach@example.com" }));
    expect(onOpen).toHaveBeenCalledWith("u2");
  });

  it("search, filter and sort change the query, back to the first page", async () => {
    const onQueryChange = vi.fn();
    render(<AccountList query={{ ...query, page: 2 }} onQueryChange={onQueryChange} onOpen={vi.fn()} />);
    await screen.findByRole("table", { name: "Accounts" });

    await userEvent.type(screen.getByRole("searchbox", { name: "Search by email" }), "coach");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({ ...query, search: "coach", page: 0 });

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Status" }), "disabled");
    expect(onQueryChange).toHaveBeenLastCalledWith({ ...query, status: "disabled", page: 0 });

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Role" }), "supporter");
    expect(onQueryChange).toHaveBeenLastCalledWith({ ...query, role: "supporter", page: 0 });

    const emailHeader = screen.getByRole("columnheader", { name: /email/i });
    expect(emailHeader).toHaveAttribute("aria-sort", "none");
    await userEvent.click(within(emailHeader).getByRole("button"));
    expect(onQueryChange).toHaveBeenLastCalledWith({ ...query, sort: "email_desc", page: 0 });
    expect(screen.getByRole("columnheader", { name: /created/i })).toHaveAttribute("aria-sort", "descending");
  });

  it("pages 50 at a time", async () => {
    vi.mocked(listAccounts).mockResolvedValue({ accounts: [account({})], total: 120 });
    const onQueryChange = vi.fn();
    render(<AccountList query={{ ...query, page: 1 }} onQueryChange={onQueryChange} onOpen={vi.fn()} />);

    expect(await screen.findByText("Showing 51–100 of 120")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({ ...query, page: 2 });
    await userEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({ ...query, page: 0 });
  });
});
