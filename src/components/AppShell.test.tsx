import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppShell from "./AppShell";

describe("AppShell", () => {
  it("renders all three tabs and the active tab's content", () => {
    render(
      <AppShell activeTab="home" onTabChange={vi.fn()}>
        <p>Home content</p>
      </AppShell>,
    );

    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Plan" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(
      screen.getByRole("button", { name: "Assignments" }),
    ).not.toHaveAttribute("aria-current");
    expect(screen.getByText("Home content")).toBeInTheDocument();
  });

  it("calls onTabChange with the tapped tab", async () => {
    const onTabChange = vi.fn();
    const userEventInstance = userEvent.setup();

    render(
      <AppShell activeTab="home" onTabChange={onTabChange}>
        <p>Home content</p>
      </AppShell>,
    );

    await userEventInstance.click(screen.getByRole("button", { name: "Plan" }));
    expect(onTabChange).toHaveBeenCalledWith("plan");

    await userEventInstance.click(
      screen.getByRole("button", { name: "Assignments" }),
    );
    expect(onTabChange).toHaveBeenCalledWith("assignments");
  });
});
