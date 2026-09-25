import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import MobileActionBar from "./MobileActionBar";

describe("MobileActionBar", () => {
  it("renders its actions in order", () => {
    render(
      <MobileActionBar>
        <button type="button">Back</button>
        <button type="button">Next: when</button>
      </MobileActionBar>,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual(["Back", "Next: when"]);
  });

  // docs/features/mobile-app-shell-and-touch-ergonomics-v0.1.md §3: the
  // sticky offset must come from the same variable as the tab bar's height.
  it("sticks above the tab bar using the shared --tab-bar-height variable", () => {
    const { container } = render(
      <MobileActionBar>
        <button type="button">Save</button>
      </MobileActionBar>,
    );

    const bar = container.firstElementChild!;
    expect(bar).toHaveClass("sticky");
    expect(bar.className).toContain("bottom-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))]");
  });
});
