import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./LoginPage";

describe("LoginPage", () => {
  it("renders email and password fields and submit buttons", () => {
    render(<LoginPage signIn={vi.fn()} signUp={vi.fn()} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  it("disables submit buttons until both fields are filled in", async () => {
    const user = userEvent.setup();
    render(<LoginPage signIn={vi.fn()} signUp={vi.fn()} />);

    const signInButton = screen.getByRole("button", { name: /sign in/i });
    const signUpButton = screen.getByRole("button", { name: /sign up/i });
    expect(signInButton).toBeDisabled();
    expect(signUpButton).toBeDisabled();

    await user.type(screen.getByLabelText(/email/i), "person@example.com");
    expect(signInButton).toBeDisabled();

    await user.type(screen.getByLabelText(/password/i), "secret123");
    expect(signInButton).toBeEnabled();
    expect(signUpButton).toBeEnabled();
  });

  it("calls signIn with the entered credentials", async () => {
    const user = userEvent.setup();
    const signIn = vi.fn();
    render(<LoginPage signIn={signIn} signUp={vi.fn()} />);

    await user.type(screen.getByLabelText(/email/i), "person@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(signIn).toHaveBeenCalledWith("person@example.com", "secret123");
  });

  it("calls signUp with the entered credentials", async () => {
    const user = userEvent.setup();
    const signUp = vi.fn();
    render(<LoginPage signIn={vi.fn()} signUp={signUp} />);

    await user.type(screen.getByLabelText(/email/i), "person@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(signUp).toHaveBeenCalledWith("person@example.com", "secret123");
  });
});
