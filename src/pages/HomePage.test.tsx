import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "@supabase/supabase-js";
import HomePage from "./HomePage";

const user = { email: "person@example.com" } as User;

describe("HomePage", () => {
  it("renders the logged-in user's email", () => {
    render(<HomePage user={user} signOut={vi.fn()} />);

    expect(screen.getByText(/person@example.com/)).toBeInTheDocument();
  });

  it("calls signOut when the sign out button is clicked", async () => {
    const signOut = vi.fn();
    render(<HomePage user={user} signOut={signOut} />);

    await userEvent.click(screen.getByRole("button", { name: /sign out/i }));

    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
