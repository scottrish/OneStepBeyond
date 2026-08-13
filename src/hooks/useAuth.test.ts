import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { Session, User } from "@supabase/supabase-js";

vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

const mockedAuth = supabase.auth as unknown as {
  getUser: ReturnType<typeof vi.fn>;
  onAuthStateChange: ReturnType<typeof vi.fn>;
  signInWithPassword: ReturnType<typeof vi.fn>;
  signUp: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
};

const user = { email: "person@example.com" } as User;

beforeEach(() => {
  vi.clearAllMocks();
  mockedAuth.getUser.mockResolvedValue({ data: { user: null } });
  mockedAuth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
});

describe("useAuth", () => {
  it("loads the current user on mount", async () => {
    mockedAuth.getUser.mockResolvedValue({ data: { user } });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.user).toEqual(user));
  });

  it("updates the user when the auth state changes", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(mockedAuth.onAuthStateChange).toHaveBeenCalled());

    const onAuthStateChange = mockedAuth.onAuthStateChange.mock.calls[0][0];
    act(() => {
      onAuthStateChange("SIGNED_IN", { user } as Session);
    });

    expect(result.current.user).toEqual(user);
  });

  it("signs in without alerting when credentials are valid", async () => {
    mockedAuth.signInWithPassword.mockResolvedValue({ error: null });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signIn("person@example.com", "secret123"));

    expect(mockedAuth.signInWithPassword).toHaveBeenCalledWith({
      email: "person@example.com",
      password: "secret123",
    });
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("alerts the error message when sign-in fails", async () => {
    mockedAuth.signInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signIn("person@example.com", "wrong-password"));

    expect(alertSpy).toHaveBeenCalledWith("Invalid login credentials");
  });

  it("signs out", async () => {
    mockedAuth.signOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signOut());

    expect(mockedAuth.signOut).toHaveBeenCalledTimes(1);
  });
});
