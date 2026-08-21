import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "@supabase/supabase-js";

vi.mock("../services/supportRelationshipService", () => ({
  listRelationshipsForStudent: vi.fn(),
  createInvitation: vi.fn(),
}));

import * as supportRelationshipService from "../services/supportRelationshipService";
import SupportPage from "./SupportPage";

const mockedService = supportRelationshipService as unknown as {
  listRelationshipsForStudent: ReturnType<typeof vi.fn>;
  createInvitation: ReturnType<typeof vi.fn>;
};

const user = { id: "student-1", email: "student@example.com" } as User;

describe("SupportPage", () => {
  it("shows the empty state when there are no supporters", async () => {
    mockedService.listRelationshipsForStudent.mockResolvedValue([]);

    render(<SupportPage user={user} onBack={vi.fn()} />);

    expect(await screen.findByText(/no one supporting you yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add someone who supports you/i })).toBeInTheDocument();
  });

  it("lists Active and Pending supporters separately", async () => {
    mockedService.listRelationshipsForStudent.mockResolvedValue([
      { id: "r1", invitedEmail: "coach@example.com", role: "coach", status: "active", invitedAt: "2026-08-01" },
      {
        id: "r2",
        invitedEmail: "parent@example.com",
        role: "parent_guardian",
        status: "pending",
        invitedAt: "2026-08-19",
      },
    ]);

    render(<SupportPage user={user} onBack={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: "Active" })).toBeInTheDocument();
    expect(screen.getByText("coach@example.com")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pending" })).toBeInTheDocument();
    expect(screen.getByText("parent@example.com")).toBeInTheDocument();
    expect(screen.getByText(/invite pending/i)).toBeInTheDocument();
  });

  // docs/features/supporter-invitation-feature-spec-v0.1.md §7 — the
  // full wizard, and §3's 2026-08-19 update: Teacher stores the exact
  // same role as Coach.
  it("walks through choose role -> email -> explain -> send, and displays the constructed link", async () => {
    mockedService.listRelationshipsForStudent.mockResolvedValue([]);
    mockedService.createInvitation.mockResolvedValue({
      relationshipId: "r1",
      rawToken: "abc-123",
    });
    const userEventInstance = userEvent.setup();

    render(<SupportPage user={user} onBack={vi.fn()} />);
    await screen.findByText(/no one supporting you yet/i);

    await userEventInstance.click(screen.getByRole("button", { name: /add someone who supports you/i }));
    expect(await screen.findByRole("heading", { name: /who would you like to add/i })).toBeInTheDocument();

    await userEventInstance.click(screen.getByRole("button", { name: "Teacher" }));
    expect(await screen.findByRole("heading", { name: /what.s their email/i })).toBeInTheDocument();

    await userEventInstance.type(screen.getByLabelText(/email/i), "teacher@example.com");
    await userEventInstance.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByText(/coach dashboard/i)).toBeInTheDocument();
    await userEventInstance.click(screen.getByRole("button", { name: /send invite/i }));

    expect(mockedService.createInvitation).toHaveBeenCalledWith({
      studentId: "student-1",
      invitedEmail: "teacher@example.com",
      // Teacher and Coach are the exact same stored role.
      role: "coach",
    });
    expect(await screen.findByRole("heading", { name: /invite ready/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue(/token=abc-123/)).toBeInTheDocument();
  });

  it("shows an error and does not advance when sending fails", async () => {
    mockedService.listRelationshipsForStudent.mockResolvedValue([]);
    mockedService.createInvitation.mockRejectedValue({ message: "boom" });
    const userEventInstance = userEvent.setup();

    render(<SupportPage user={user} onBack={vi.fn()} />);
    await screen.findByText(/no one supporting you yet/i);

    await userEventInstance.click(screen.getByRole("button", { name: /add someone who supports you/i }));
    await userEventInstance.click(screen.getByRole("button", { name: "Coach" }));
    await userEventInstance.type(screen.getByLabelText(/email/i), "coach@example.com");
    await userEventInstance.click(screen.getByRole("button", { name: /continue/i }));
    await userEventInstance.click(screen.getByRole("button", { name: /send invite/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("boom");
    expect(screen.queryByRole("heading", { name: /invite ready/i })).not.toBeInTheDocument();
  });

  it("calls onBack when Back is clicked from the list", async () => {
    mockedService.listRelationshipsForStudent.mockResolvedValue([]);
    const onBack = vi.fn();
    const userEventInstance = userEvent.setup();

    render(<SupportPage user={user} onBack={onBack} />);
    await screen.findByText(/no one supporting you yet/i);

    await userEventInstance.click(screen.getByRole("button", { name: /back/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
