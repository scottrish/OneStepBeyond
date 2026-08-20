import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "../hooks/useAuth";
import DashboardApp from "./DashboardApp";

vi.mock("../hooks/useAuth");

vi.mock("../services/courseService", () => ({ listCourses: vi.fn().mockResolvedValue([]) }));
vi.mock("../services/assignmentService", () => ({ listAssignments: vi.fn().mockResolvedValue([]) }));
vi.mock("../services/workItemService", () => ({ listWorkItemsForStudent: vi.fn().mockResolvedValue([]) }));
vi.mock("../services/decompositionAttemptService", () => ({ listForStudent: vi.fn().mockResolvedValue([]) }));
vi.mock("../services/reflectionService", () => ({ listForStudent: vi.fn().mockResolvedValue([]) }));
vi.mock("../services/superuserService", () => ({
  isSuperuser: vi.fn().mockResolvedValue(false),
  listKnownStudentIds: vi.fn().mockResolvedValue([]),
}));
vi.mock("../services/supportRelationshipService", () => ({
  listActiveRelationshipsForSupporter: vi.fn().mockResolvedValue([]),
}));

import * as superuserService from "../services/superuserService";
import * as supportRelationshipService from "../services/supportRelationshipService";

const mockedSuperuserService = superuserService as unknown as {
  isSuperuser: ReturnType<typeof vi.fn>;
  listKnownStudentIds: ReturnType<typeof vi.fn>;
};
const mockedSupportRelationshipService = supportRelationshipService as unknown as {
  listActiveRelationshipsForSupporter: ReturnType<typeof vi.fn>;
};

const supporterUser = { id: "supporter-1", email: "supporter@example.com" } as User;

beforeEach(() => {
  vi.mocked(useAuth).mockReset();
  mockedSuperuserService.isSuperuser.mockReset().mockResolvedValue(false);
  mockedSuperuserService.listKnownStudentIds.mockReset().mockResolvedValue([]);
  mockedSupportRelationshipService.listActiveRelationshipsForSupporter.mockReset().mockResolvedValue([]);
});

describe("DashboardApp", () => {
  it("shows the login page when there is no authenticated user", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    render(<DashboardApp />);

    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  });

  // docs/features/supporter-role-based-access-feature-spec-v0.1.md §7.2 —
  // this is the whole point of the spec: signing in is no longer enough
  // to reach anything. A session with no Active relationship and no
  // superuser status is denied outright, not shown an empty dashboard
  // shell (which the old mode-toggle version effectively was).
  it("denies access to a signed-in user with no Active Support Relationship and no superuser status", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: supporterUser,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    render(<DashboardApp />);

    expect(
      await screen.findByText(/you don.t currently support any students/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^overview$/i })).not.toBeInTheDocument();
  });

  it("auto-opens the dashboard at the correct mode for a supporter with exactly one Active relationship", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: supporterUser,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    mockedSupportRelationshipService.listActiveRelationshipsForSupporter.mockResolvedValue([
      { id: "r1", studentId: "student-1", role: "coach" },
    ]);

    render(<DashboardApp />);

    expect(await screen.findByRole("heading", { name: /^overview$/i })).toBeInTheDocument();
    expect(screen.getByText("Coach")).toBeInTheDocument();
    // No control to change it — mode is derived, not chosen.
    expect(screen.queryByRole("button", { name: "Parent" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Diagnostic" })).not.toBeInTheDocument();
  });

  it("shows a Parent-labeled dashboard for a parent_guardian relationship", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: supporterUser,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    mockedSupportRelationshipService.listActiveRelationshipsForSupporter.mockResolvedValue([
      { id: "r1", studentId: "student-1", role: "parent_guardian" },
    ]);

    render(<DashboardApp />);

    expect(await screen.findByRole("heading", { name: /how things are going/i })).toBeInTheDocument();
    expect(screen.getByText("Parent")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Dashboard" });
    expect(within(nav).queryByRole("button", { name: "Evidence Timeline" })).not.toBeInTheDocument();
    expect(within(nav).queryByRole("button", { name: "Diagnostics" })).not.toBeInTheDocument();
  });

  it("shows a student picker for a supporter with more than one Active relationship, then opens the chosen one", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: supporterUser,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    mockedSupportRelationshipService.listActiveRelationshipsForSupporter.mockResolvedValue([
      { id: "r1", studentId: "student-1", role: "coach" },
      { id: "r2", studentId: "student-2", role: "parent_guardian" },
    ]);
    const userEventInstance = userEvent.setup();

    render(<DashboardApp />);

    expect(await screen.findByRole("heading", { name: /who do you want to support/i })).toBeInTheDocument();
    expect(screen.getByText("Coach")).toBeInTheDocument();
    expect(screen.getByText("Parent / Guardian")).toBeInTheDocument();

    await userEventInstance.click(screen.getByText("Coach"));

    expect(await screen.findByRole("heading", { name: /^overview$/i })).toBeInTheDocument();
    // Two relationships — a way back to the picker is offered.
    expect(screen.getByRole("button", { name: /switch student/i })).toBeInTheDocument();
  });

  // docs/features/supporter-role-based-access-feature-spec-v0.1.md §7.3 —
  // the whole reason Diagnostic Mode moved off a free client toggle: an
  // Active relationship, no matter how many, must never be a path to it.
  it("never offers Diagnostics to a supporter, even with multiple Active relationships", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: supporterUser,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    mockedSupportRelationshipService.listActiveRelationshipsForSupporter.mockResolvedValue([
      { id: "r1", studentId: "student-1", role: "coach" },
    ]);

    render(<DashboardApp />);

    expect(await screen.findByRole("heading", { name: /^overview$/i })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Dashboard" });
    expect(within(nav).queryByRole("button", { name: "Diagnostics" })).not.toBeInTheDocument();
  });

  it("switches screens via the sidebar nav", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: supporterUser,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    mockedSupportRelationshipService.listActiveRelationshipsForSupporter.mockResolvedValue([
      { id: "r1", studentId: "student-1", role: "coach" },
    ]);
    const userEventInstance = userEvent.setup();

    render(<DashboardApp />);
    await screen.findByRole("heading", { name: /^overview$/i });
    const nav = screen.getByRole("navigation", { name: "Dashboard" });

    await userEventInstance.click(within(nav).getByRole("button", { name: "Reflections" }));

    expect(await screen.findByRole("heading", { name: /^reflections$/i })).toBeInTheDocument();
  });

  describe("superuser (Diagnostic Mode)", () => {
    it("shows a student picker sourced from known students, never from Support Relationships", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: supporterUser,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      });
      mockedSuperuserService.isSuperuser.mockResolvedValue(true);
      // 8-char ids so studentLabel's slice(0, 8) truncation (meaningful
      // for a real UUID) doesn't collide the two fixtures into the same
      // rendered text.
      mockedSuperuserService.listKnownStudentIds.mockResolvedValue(["aaaaaaaa", "bbbbbbbb"]);
      // Even if the same account also happens to hold a real relationship,
      // the superuser path takes priority and isn't blended with it.
      mockedSupportRelationshipService.listActiveRelationshipsForSupporter.mockResolvedValue([
        { id: "r1", studentId: "aaaaaaaa", role: "coach" },
      ]);
      const userEventInstance = userEvent.setup();

      render(<DashboardApp />);

      expect(await screen.findByRole("heading", { name: /diagnostic mode/i })).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: /who do you want to support/i })).not.toBeInTheDocument();

      await userEventInstance.click(screen.getByText(/aaaaaaaa/i));

      expect(await screen.findByRole("heading", { name: /^overview$/i })).toBeInTheDocument();
      expect(screen.getByText("Diagnostic")).toBeInTheDocument();
      const nav = screen.getByRole("navigation", { name: "Dashboard" });
      expect(within(nav).getByRole("button", { name: "Diagnostics" })).toBeInTheDocument();
    });
  });

  it("signs out via the header button", async () => {
    const signOut = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      user: supporterUser,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut,
    });
    mockedSupportRelationshipService.listActiveRelationshipsForSupporter.mockResolvedValue([
      { id: "r1", studentId: "student-1", role: "coach" },
    ]);
    const userEventInstance = userEvent.setup();

    render(<DashboardApp />);
    await screen.findByRole("heading", { name: /^overview$/i });

    await userEventInstance.click(screen.getByRole("button", { name: /sign out/i }));

    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
