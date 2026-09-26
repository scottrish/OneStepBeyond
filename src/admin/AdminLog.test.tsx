import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../services/adminService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../services/adminService")>()),
  listActions: vi.fn(),
  listLogAdmins: vi.fn(),
}));

import { listActions, listLogAdmins, type AdminLogEntry, type AdminLogQuery } from "../services/adminService";
import AdminLog from "./AdminLog";

const entry = (patch: Partial<AdminLogEntry>): AdminLogEntry => ({
  id: "a1",
  action: "clear",
  categories: ["plans"],
  alsoDisabled: false,
  counts: { work_sessions: 3 },
  createdAt: "2026-09-26T15:00:00Z",
  adminEmail: "admin@example.com",
  adminId: "admin-1",
  targetUserId: "u1",
  targetEmail: "student@example.com",
  ...patch,
});

const query: AdminLogQuery = { action: null, adminId: null, accountSearch: "", fromDay: "", toDay: "", page: 0 };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listLogAdmins).mockResolvedValue([
    { id: "admin-1", email: "admin@example.com" },
    { id: "admin-2", email: null },
  ]);
  vi.mocked(listActions).mockResolvedValue({
    entries: [
      entry({}),
      entry({ id: "a2", action: "disable", categories: [], counts: {}, targetUserId: "u2", targetEmail: null }),
    ],
    total: 2,
  });
});

describe("AdminLog (admin-action-log-v0.1.md)", () => {
  it("every action: when, admin, account, what, removed; a deleted account says so", async () => {
    render(<AdminLog query={query} onQueryChange={vi.fn()} onOpenAccount={vi.fn()} />);
    const table = await screen.findByRole("table", { name: "Admin actions, newest first" });
    const rows = within(table).getAllByRole("row");

    expect(rows[1]).toHaveTextContent(/admin@example.com\s*student@example.com\s*Cleared plans \(keeps assignments and steps\)\s*3 planned sessions/);
    expect(rows[2]).toHaveTextContent(/Deleted account\s*Turned off\s*—/);
    expect(within(rows[2]!).queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Showing 1–2 of 2")).toBeInTheDocument();
  });

  it("an entry's account opens its page", async () => {
    const onOpenAccount = vi.fn();
    render(<AdminLog query={query} onQueryChange={vi.fn()} onOpenAccount={onOpenAccount} />);
    const table = await screen.findByRole("table", { name: "Admin actions, newest first" });
    await userEvent.click(within(table).getByRole("button", { name: "student@example.com" }));
    expect(onOpenAccount).toHaveBeenCalledWith("u1");
  });

  it("each filter changes the query, back to page 1; days become local bounds", async () => {
    const onQueryChange = vi.fn();
    render(<AdminLog query={{ ...query, page: 3 }} onQueryChange={onQueryChange} onOpenAccount={vi.fn()} />);
    await screen.findByRole("table", { name: "Admin actions, newest first" });

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Action" }), "enable");
    expect(onQueryChange).toHaveBeenLastCalledWith({ ...query, action: "enable", page: 0 });

    const adminFilter = screen.getByRole("combobox", { name: "Admin" });
    expect(within(adminFilter).getByRole("option", { name: "Deleted account" })).toBeInTheDocument();
    await userEvent.selectOptions(adminFilter, "admin-1");
    expect(onQueryChange).toHaveBeenLastCalledWith({ ...query, adminId: "admin-1", page: 0 });

    await userEvent.type(screen.getByRole("searchbox", { name: "Search by account email" }), "kid");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({ ...query, accountSearch: "kid", page: 0 });

    // Native date inputs: set the value directly, as a browser would.
    const fromInput = screen.getByLabelText("From");
    await userEvent.type(fromInput, "2026-09-01");
    expect(onQueryChange).toHaveBeenLastCalledWith({ ...query, fromDay: "2026-09-01", page: 0 });
  });

  it("the query's days reach the service as local-day bounds", async () => {
    render(
      <AdminLog query={{ ...query, fromDay: "2026-09-01", toDay: "2026-09-26" }} onQueryChange={vi.fn()} onOpenAccount={vi.fn()} />,
    );
    await screen.findByRole("table", { name: "Admin actions, newest first" });
    expect(listActions).toHaveBeenCalledWith(expect.objectContaining({ fromDay: "2026-09-01" }), {
      from: new Date(2026, 8, 1).toISOString(),
      to: new Date(2026, 8, 27).toISOString(),
    });
  });

  it("empty: 'No admin actions yet', or 'No admin actions match' when filtered", async () => {
    vi.mocked(listActions).mockResolvedValue({ entries: [], total: 0 });
    const { unmount } = render(<AdminLog query={query} onQueryChange={vi.fn()} onOpenAccount={vi.fn()} />);
    expect(await screen.findByText("No admin actions yet.")).toBeInTheDocument();
    unmount();

    render(<AdminLog query={{ ...query, action: "enable" }} onQueryChange={vi.fn()} onOpenAccount={vi.fn()} />);
    expect(await screen.findByText("No admin actions match.")).toBeInTheDocument();
  });

  it("pages 50 at a time", async () => {
    vi.mocked(listActions).mockResolvedValue({ entries: [entry({})], total: 75 });
    const onQueryChange = vi.fn();
    render(<AdminLog query={{ ...query, page: 1 }} onQueryChange={onQueryChange} onOpenAccount={vi.fn()} />);

    expect(await screen.findByText("Showing 51–75 of 75")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(onQueryChange).toHaveBeenLastCalledWith({ ...query, page: 0 });
  });
});
