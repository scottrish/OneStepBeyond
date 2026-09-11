import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorBanner from "./ErrorBanner";

describe("ErrorBanner", () => {
  it("renders a bare alert with no retry button when onRetry is omitted", () => {
    render(<ErrorBanner message="Something went wrong." />);

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong.");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a retry button and calls onRetry when provided", async () => {
    const onRetry = vi.fn();
    const userEventInstance = userEvent.setup();

    render(<ErrorBanner message="Couldn’t load your data." onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Couldn’t load your data.");
    await userEventInstance.click(screen.getByRole("button", { name: /try again/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("supports a custom retry label", () => {
    render(<ErrorBanner message="Failed." onRetry={vi.fn()} retryLabel="Retry" />);

    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
