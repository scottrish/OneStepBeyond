import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../services/adminService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../services/adminService")>()),
  getAccount: vi.fn(),
  setAccountDisabled: vi.fn(),
  previewClear: vi.fn(),
  clearAccount: vi.fn(),
}));

import {
  clearAccount,
  getAccount,
  previewClear,
  setAccountDisabled,
  type AccountDetail,
  type AdminAccount,
} from "../services/adminService";
import AccountPage from "./AccountPage";

const student: AdminAccount = {
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
};

function detail(patch: Partial<AdminAccount> = {}, extra: Partial<AccountDetail> = {}): AccountDetail {
  return {
    account: { ...student, ...patch },
    asStudent: [{ id: "r1", role: "coach", status: "active", invitedAt: "t", otherEmail: "coach@example.com" }],
    asSupporter: [],
    actions: [],
    ...extra,
  };
}

function renderPage(meId = "admin-1") {
  render(<AccountPage userId="u1" meId={meId} onBack={vi.fn()} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAccount).mockResolvedValue(detail());
  vi.mocked(previewClear).mockResolvedValue({ work_sessions: 3, planning_sessions: 1 });
});

describe("AccountPage (admin-account-management-v0.1.md, requirement 2)", () => {
  it("details, supporters and the record", async () => {
    vi.mocked(getAccount).mockResolvedValue(
      detail({}, {
        actions: [
          {
            id: "a1",
            action: "clear",
            categories: ["plans"],
            alsoDisabled: false,
            counts: { work_sessions: 2 },
            createdAt: "2026-09-25T15:00:00Z",
            adminEmail: "admin@example.com",
          },
        ],
      }),
    );
    renderPage();

    expect(await screen.findByRole("heading", { name: "student@example.com" })).toBeInTheDocument();
    expect(screen.getByText("coach@example.com · Coach · active")).toBeInTheDocument();
    expect(screen.getByText(/Cleared plans/)).toBeInTheDocument();
    expect(screen.getByText("2 planned sessions")).toBeInTheDocument();
    expect(screen.getByText(/by admin@example.com/)).toBeInTheDocument();
  });

  describe("turning off and on (A3)", () => {
    it("asks first, then turns it off and says so", async () => {
      vi.mocked(setAccountDisabled).mockResolvedValue(undefined);
      renderPage();

      await userEvent.click(await screen.findByRole("button", { name: "Turn off this account" }));
      const sheet = screen.getByRole("dialog", { name: "Turn off this account?" });
      expect(sheet).toHaveTextContent("won’t be able to sign in");
      vi.mocked(getAccount).mockResolvedValue(detail({ status: "disabled" }));
      await userEvent.click(within(sheet).getByRole("button", { name: "Turn off" }));

      await waitFor(() => expect(setAccountDisabled).toHaveBeenCalledWith("u1", true));
      expect(await screen.findByText("The account is turned off.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Turn this account back on" })).toBeInTheDocument();
    });

    it("a disabled account can be turned back on", async () => {
      vi.mocked(getAccount).mockResolvedValue(detail({ status: "disabled" }));
      vi.mocked(setAccountDisabled).mockResolvedValue(undefined);
      renderPage();

      await userEvent.click(await screen.findByRole("button", { name: "Turn this account back on" }));
      await userEvent.click(screen.getByRole("button", { name: "Turn back on" }));
      await waitFor(() => expect(setAccountDisabled).toHaveBeenCalledWith("u1", false));
    });

    it("a refusal from the database is shown", async () => {
      vi.mocked(setAccountDisabled).mockRejectedValue({ message: "Admin accounts can't be changed here." });
      renderPage();

      await userEvent.click(await screen.findByRole("button", { name: "Turn off this account" }));
      await userEvent.click(screen.getByRole("button", { name: "Turn off" }));
      expect(await screen.findByText("Admin accounts can't be changed here.")).toBeInTheDocument();
    });
  });

  describe("protected accounts (A6, Q2)", () => {
    it("another admin: nothing can be changed", async () => {
      vi.mocked(getAccount).mockResolvedValue(detail({ isAdmin: true }));
      renderPage();

      expect(await screen.findByText("Admin accounts can’t be changed here.")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /turn off/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Clear data" })).not.toBeInTheDocument();
    });

    it("yourself: can clear, can't turn off — not even from the clear sheet", async () => {
      vi.mocked(getAccount).mockResolvedValue(detail({ isAdmin: true }));
      renderPage("u1");

      expect(await screen.findByText("You can’t turn off your own account.")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("checkbox", { name: "All data" }));
      await userEvent.click(screen.getByRole("button", { name: "Review what will be cleared" }));
      const sheet = await screen.findByRole("dialog", { name: "Clear all data?" });
      expect(within(sheet).queryByRole("checkbox", { name: "Also turn off this account" })).not.toBeInTheDocument();
    });
  });

  describe("clearing data (requirement 3, A5, A7)", () => {
    it("selective: shows what will be removed, then clears exactly the chosen categories", async () => {
      vi.mocked(clearAccount).mockResolvedValue({ removed: { work_sessions: 3, planning_sessions: 1 }, disabled: false });
      renderPage();

      const review = await screen.findByRole("button", { name: "Review what will be cleared" });
      expect(review).toBeDisabled();
      await userEvent.click(screen.getByRole("checkbox", { name: /Plans \(keeps assignments and steps\)/ }));
      await userEvent.click(review);

      const sheet = await screen.findByRole("dialog", { name: "Clear this data?" });
      expect(await within(sheet).findByText("3 planned sessions")).toBeInTheDocument();
      expect(within(sheet).getByText("1 plan history entry")).toBeInTheDocument();
      expect(previewClear).toHaveBeenCalledWith("u1", ["plans"]);
      expect(within(sheet).queryByLabelText(/to confirm/)).not.toBeInTheDocument();

      await userEvent.click(within(sheet).getByRole("button", { name: "Clear" }));
      await waitFor(() => expect(clearAccount).toHaveBeenCalledWith("u1", ["plans"], false));
      expect(await screen.findByText("Cleared: 3 planned sessions, 1 plan history entry.")).toBeInTheDocument();
    });

    it("all data: needs the email typed; 'Also turn off' clears and turns off in one step", async () => {
      vi.mocked(clearAccount).mockResolvedValue({ removed: { courses: 2 }, disabled: true });
      renderPage();

      await userEvent.click(await screen.findByRole("checkbox", { name: "All data" }));
      expect(screen.getByRole("checkbox", { name: "Activities" })).toBeChecked();
      await userEvent.click(screen.getByRole("button", { name: "Review what will be cleared" }));

      const sheet = await screen.findByRole("dialog", { name: "Clear all data?" });
      const confirm = within(sheet).getByRole("button", { name: "Clear all data" });
      await within(sheet).findByText("3 planned sessions");
      expect(confirm).toBeDisabled();

      await userEvent.type(within(sheet).getByLabelText(/Type student@example.com to confirm/), "Student@Example.com");
      expect(confirm).toBeEnabled();

      const alsoTurnOff = within(sheet).getByRole("checkbox", { name: "Also turn off this account" });
      expect(alsoTurnOff).not.toBeChecked();
      await userEvent.click(alsoTurnOff);
      const both = within(sheet).getByRole("button", { name: "Clear all data and turn off" });
      await userEvent.click(both);

      await waitFor(() =>
        expect(clearAccount).toHaveBeenCalledWith(
          "u1",
          ["courses", "assignments", "plans", "history", "activities", "study_hours", "support"],
          true,
        ),
      );
      expect(await screen.findByText("Cleared: 2 courses. The account is turned off.")).toBeInTheDocument();
    });

    it("an account that's already off isn't offered 'Also turn off'", async () => {
      vi.mocked(getAccount).mockResolvedValue(detail({ status: "disabled" }));
      renderPage();

      await userEvent.click(await screen.findByRole("checkbox", { name: "All data" }));
      await userEvent.click(screen.getByRole("button", { name: "Review what will be cleared" }));
      const sheet = await screen.findByRole("dialog", { name: "Clear all data?" });
      expect(within(sheet).queryByRole("checkbox", { name: "Also turn off this account" })).not.toBeInTheDocument();
    });

    it("cancel clears nothing", async () => {
      renderPage();
      await userEvent.click(await screen.findByRole("checkbox", { name: "Activities" }));
      await userEvent.click(screen.getByRole("button", { name: "Review what will be cleared" }));
      const sheet = await screen.findByRole("dialog", { name: "Clear this data?" });
      await userEvent.click(within(sheet).getByRole("button", { name: "Cancel" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(clearAccount).not.toHaveBeenCalled();
    });
  });
});
