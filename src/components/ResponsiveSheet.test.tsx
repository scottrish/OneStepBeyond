import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResponsiveSheet from "./ResponsiveSheet";

// A controlled harness with a real trigger, so focus return can be checked.
function Harness({
  description,
  onOpenChange,
}: {
  description?: string;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open sheet
      </button>
      <ResponsiveSheet
        open={open}
        onOpenChange={(next) => {
          onOpenChange?.(next);
          setOpen(next);
        }}
        title="When would you rather do this?"
        {...(description ? { description } : {})}
      >
        <button type="button">Tomorrow</button>
      </ResponsiveSheet>
    </>
  );
}

describe("ResponsiveSheet", () => {
  it("renders nothing while closed", () => {
    render(<Harness />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("exposes its title and description as the dialog's accessible name and description", async () => {
    const userEventInstance = userEvent.setup();
    render(<Harness description="Choose the closest answer." />);

    await userEventInstance.click(screen.getByRole("button", { name: "Open sheet" }));

    const dialog = await screen.findByRole("dialog", { name: "When would you rather do this?" });
    expect(dialog).toHaveAccessibleDescription("Choose the closest answer.");
    expect(screen.getByRole("button", { name: "Tomorrow" })).toBeInTheDocument();
  });

  it("works without a description", async () => {
    const userEventInstance = userEvent.setup();
    render(<Harness />);

    await userEventInstance.click(screen.getByRole("button", { name: "Open sheet" }));

    expect(
      await screen.findByRole("dialog", { name: "When would you rather do this?" }),
    ).toBeInTheDocument();
  });

  it("treats Escape as a cancel and returns focus to the trigger", async () => {
    const onOpenChange = vi.fn();
    const userEventInstance = userEvent.setup();
    render(<Harness onOpenChange={onOpenChange} />);

    const trigger = screen.getByRole("button", { name: "Open sheet" });
    await userEventInstance.click(trigger);
    await screen.findByRole("dialog");

    await userEventInstance.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("treats the 44px close button as a cancel", async () => {
    const onOpenChange = vi.fn();
    const userEventInstance = userEvent.setup();
    render(<Harness onOpenChange={onOpenChange} />);

    await userEventInstance.click(screen.getByRole("button", { name: "Open sheet" }));
    const close = await screen.findByRole("button", { name: "Close" });
    expect(close).toHaveClass("size-11");

    await userEventInstance.click(close);

    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("is a bottom sheet below sm: and a centered dialog from sm:", async () => {
    const userEventInstance = userEvent.setup();
    render(<Harness />);

    await userEventInstance.click(screen.getByRole("button", { name: "Open sheet" }));
    const dialog = await screen.findByRole("dialog");

    expect(dialog).toHaveClass("bottom-0", "rounded-t-3xl", "max-h-[88dvh]");
    expect(dialog).toHaveClass("sm:top-1/2", "sm:left-1/2", "sm:max-w-md", "sm:rounded-2xl");
  });
});
