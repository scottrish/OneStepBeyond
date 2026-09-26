import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { User } from "@supabase/supabase-js";

vi.mock("../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../services/superuserService", () => ({ isSuperuser: vi.fn() }));
vi.mock("../services/adminService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../services/adminService")>()),
  listAccounts: vi.fn(),
  listActions: vi.fn(),
  listLogAdmins: vi.fn(),
  getAccount: vi.fn(),
}));

import { useAuth } from "../hooks/useAuth";
import { isSuperuser } from "../services/superuserService";
import { getAccount, listAccounts, listActions, listLogAdmins } from "../services/adminService";
import userEvent from "@testing-library/user-event";
import AdminApp from "./AdminApp";

const me = { id: "admin-1", email: "admin@example.com" } as User;

function signedInAs(user: User | null) {
  vi.mocked(useAuth).mockReturnValue({ user, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AdminApp (admin-account-management-v0.1.md, A2)", () => {
  it("signed out: the usual sign-in", () => {
    signedInAs(null);
    render(<AdminApp />);
    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  });

  it("not a superuser: one line, and nothing else loads", async () => {
    signedInAs(me);
    vi.mocked(isSuperuser).mockResolvedValue(false);
    render(<AdminApp />);

    expect(await screen.findByRole("heading", { name: "This page is for administrators" })).toBeInTheDocument();
    expect(listAccounts).not.toHaveBeenCalled();
  });

  it("a superuser: the account list", async () => {
    signedInAs(me);
    vi.mocked(isSuperuser).mockResolvedValue(true);
    vi.mocked(listAccounts).mockResolvedValue({ accounts: [], total: 0 });
    render(<AdminApp />);

    expect(await screen.findByRole("heading", { name: "Accounts" })).toBeInTheDocument();
    expect(await screen.findByText("No accounts match.")).toBeInTheDocument();
  });

  describe("the Admin log view (admin-action-log-v0.1.md, L1 and G3)", () => {
    beforeEach(() => {
      signedInAs(me);
      vi.mocked(isSuperuser).mockResolvedValue(true);
      vi.mocked(listAccounts).mockResolvedValue({ accounts: [], total: 0 });
      vi.mocked(listLogAdmins).mockResolvedValue([]);
      vi.mocked(listActions).mockResolvedValue({
        entries: [
          {
            id: "a1",
            action: "disable",
            categories: [],
            alsoDisabled: false,
            counts: {},
            createdAt: "2026-09-26T15:00:00Z",
            adminEmail: "admin@example.com",
            adminId: "admin-1",
            targetUserId: "u1",
            targetEmail: "student@example.com",
          },
        ],
        total: 1,
      });
      vi.mocked(getAccount).mockResolvedValue({
        account: {
          id: "u1",
          email: "student@example.com",
          createdAt: "2026-09-01T00:00:00Z",
          lastSignInAt: null,
          status: "disabled",
          isStudent: true,
          isSupporter: false,
          isAdmin: false,
          courseCount: 0,
          assignmentCount: 0,
          plannedSessionCount: 0,
        },
        asStudent: [],
        asSupporter: [],
        actions: [],
      });
    });

    it("the header navigation marks the current view", async () => {
      render(<AdminApp />);
      const nav = await screen.findByRole("navigation", { name: "Admin" });
      expect(within(nav).getByRole("button", { name: "Accounts" })).toHaveAttribute("aria-current", "page");

      await userEvent.click(within(nav).getByRole("button", { name: "Admin log" }));
      expect(await screen.findByRole("heading", { name: "Admin log" })).toBeInTheDocument();
      expect(within(nav).getByRole("button", { name: "Admin log" })).toHaveAttribute("aria-current", "page");
      expect(within(nav).getByRole("button", { name: "Accounts" })).not.toHaveAttribute("aria-current");
    });

    it("opening an account from the log: Back reads '← Admin log' and keeps the filters", async () => {
      render(<AdminApp />);
      const nav = await screen.findByRole("navigation", { name: "Admin" });
      await userEvent.click(within(nav).getByRole("button", { name: "Admin log" }));
      await userEvent.selectOptions(await screen.findByRole("combobox", { name: "Action" }), "disable");

      const table = await screen.findByRole("table", { name: "Admin actions, newest first" });
      await userEvent.click(within(table).getByRole("button", { name: "student@example.com" }));
      await userEvent.click(await screen.findByRole("button", { name: "← Admin log" }));

      expect(await screen.findByRole("heading", { name: "Admin log" })).toBeInTheDocument();
      expect(screen.getByRole("combobox", { name: "Action" })).toHaveValue("disable");
    });

    it("switching views keeps each view's own filters", async () => {
      render(<AdminApp />);
      const nav = await screen.findByRole("navigation", { name: "Admin" });
      await userEvent.selectOptions(await screen.findByRole("combobox", { name: "Status" }), "disabled");
      await userEvent.click(within(nav).getByRole("button", { name: "Admin log" }));
      await userEvent.click(within(nav).getByRole("button", { name: "Accounts" }));

      expect(await screen.findByRole("combobox", { name: "Status" })).toHaveValue("disabled");
    });
  });
});
