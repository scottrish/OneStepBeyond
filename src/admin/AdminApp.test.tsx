import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { User } from "@supabase/supabase-js";

vi.mock("../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../services/superuserService", () => ({ isSuperuser: vi.fn() }));
vi.mock("../services/adminService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../services/adminService")>()),
  listAccounts: vi.fn(),
}));

import { useAuth } from "../hooks/useAuth";
import { isSuperuser } from "../services/superuserService";
import { listAccounts } from "../services/adminService";
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
});
