import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppShell from "./AppShell";

function renderShell(overrides: Partial<Parameters<typeof AppShell>[0]> = {}) {
  return render(
    <AppShell
      activeTab="home"
      onTabChange={vi.fn()}
      onQuickAdd={vi.fn()}
      onOpenSettings={vi.fn()}
      {...overrides}
    >
      <p>Home content</p>
    </AppShell>,
  );
}

describe("AppShell", () => {
  it("renders all three tabs and the active tab's content", () => {
    renderShell();

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

    renderShell({ onTabChange });

    await userEventInstance.click(screen.getByRole("button", { name: "Plan" }));
    expect(onTabChange).toHaveBeenCalledWith("plan");

    await userEventInstance.click(
      screen.getByRole("button", { name: "Assignments" }),
    );
    expect(onTabChange).toHaveBeenCalledWith("assignments");
  });

  // docs/features/mobile-app-shell-and-touch-ergonomics-v0.1.md §1.
  it("owns the single main landmark, with the content inside it", () => {
    renderShell();

    const main = screen.getByRole("main");
    expect(within(main).getByText("Home content")).toBeInTheDocument();
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });

  it("keeps the tab bar's 'Primary' navigation landmark", () => {
    renderShell();

    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
  });

  // jsdom doesn't evaluate media queries, so the breakpoint behavior is
  // asserted through the responsive classes that implement it.
  it("shows a quick-add in the trailing slot on phones only, calling onQuickAdd", async () => {
    const onQuickAdd = vi.fn();
    const userEventInstance = userEvent.setup();
    renderShell({ onQuickAdd });

    const quickAdd = screen.getByRole("button", { name: "Add assignment" });
    expect(quickAdd.closest("li")).toHaveClass("sm:hidden");
    expect(quickAdd).toHaveClass("size-12");

    await userEventInstance.click(quickAdd);
    expect(onQuickAdd).toHaveBeenCalledTimes(1);
  });

  it("shows Settings in the trailing slot from sm: up, calling onOpenSettings", async () => {
    const onOpenSettings = vi.fn();
    const userEventInstance = userEvent.setup();
    renderShell({ onOpenSettings });

    const settings = screen.getByRole("button", { name: "Settings" });
    expect(settings.closest("li")).toHaveClass("hidden", "sm:flex");
    expect(settings).toHaveClass("size-11");

    await userEventInstance.click(settings);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });
});
