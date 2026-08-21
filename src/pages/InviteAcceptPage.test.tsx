import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "../hooks/useAuth";

vi.mock("../hooks/useAuth");
vi.mock("../services/supportRelationshipService", () => ({
  findInvitationByToken: vi.fn(),
  acceptInvitation: vi.fn(),
  declineInvitation: vi.fn(),
}));

import * as supportRelationshipService from "../services/supportRelationshipService";
import InviteAcceptPage from "./InviteAcceptPage";

const mockedService = supportRelationshipService as unknown as {
  findInvitationByToken: ReturnType<typeof vi.fn>;
  acceptInvitation: ReturnType<typeof vi.fn>;
  declineInvitation: ReturnType<typeof vi.fn>;
};

const supporterUser = { id: "supporter-1", email: "coach@example.com" } as User;

function setUrl(search: string) {
  window.history.pushState({}, "", `/invite${search}`);
}

beforeEach(() => {
  vi.mocked(useAuth).mockReset();
  mockedService.findInvitationByToken.mockReset();
  mockedService.acceptInvitation.mockReset();
  mockedService.declineInvitation.mockReset();
  setUrl("?token=abc-123");
});

describe("InviteAcceptPage", () => {
  it("shows an invalid-link message when there is no token in the URL", () => {
    setUrl("");
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    render(<InviteAcceptPage />);

    expect(screen.getByRole("heading", { name: /this link isn.t valid/i })).toBeInTheDocument();
  });

  it("shows the login page when not signed in, without attempting a lookup", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    render(<InviteAcceptPage />);

    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
    expect(mockedService.findInvitationByToken).not.toHaveBeenCalled();
  });

  it("shows a generic unavailable message when the invitation isn't found (wrong email, expired, or already used)", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: supporterUser,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    mockedService.findInvitationByToken.mockResolvedValue(null);

    render(<InviteAcceptPage />);

    expect(await screen.findByRole("heading", { name: /isn.t available/i })).toBeInTheDocument();
  });

  it("shows the invitation and accepts it", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: supporterUser,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    mockedService.findInvitationByToken.mockResolvedValue({
      id: "r1",
      invitedEmail: "coach@example.com",
      role: "coach",
    });
    mockedService.acceptInvitation.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup();

    render(<InviteAcceptPage />);

    expect(await screen.findByRole("heading", { name: /invited to support/i })).toBeInTheDocument();
    await userEventInstance.click(screen.getByRole("button", { name: /^accept$/i }));

    expect(mockedService.acceptInvitation).toHaveBeenCalledWith("r1", "supporter-1");
    expect(await screen.findByRole("heading", { name: /you.re connected/i })).toBeInTheDocument();
  });

  it("declines the invitation", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: supporterUser,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });
    mockedService.findInvitationByToken.mockResolvedValue({
      id: "r1",
      invitedEmail: "coach@example.com",
      role: "coach",
    });
    mockedService.declineInvitation.mockResolvedValue(undefined);
    const userEventInstance = userEvent.setup();

    render(<InviteAcceptPage />);

    await screen.findByRole("heading", { name: /invited to support/i });
    await userEventInstance.click(screen.getByRole("button", { name: /decline/i }));

    expect(mockedService.declineInvitation).toHaveBeenCalledWith("r1");
    expect(await screen.findByRole("heading", { name: /invitation declined/i })).toBeInTheDocument();
  });
});
