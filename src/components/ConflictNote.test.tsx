import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConflictNote from "./ConflictNote";

const queue = vi.hoisted(() => ({ conflict: false, dismissConflict: vi.fn() }));
vi.mock("../hooks/useOfflineQueue", () => ({
  useOfflineQueue: () => ({ pending: 0, stuck: false, ...queue }),
}));

describe("ConflictNote (PWA phase 2, 2c; decision Q3)", () => {
  beforeEach(() => {
    queue.conflict = false;
    queue.dismissConflict.mockClear();
  });

  it("nothing to say: nothing shown", () => {
    render(<ConflictNote />);
    expect(screen.queryByText(/didn’t apply/)).not.toBeInTheDocument();
  });

  it("says once, calmly, that some changes didn't apply, until OK", async () => {
    queue.conflict = true;
    render(<ConflictNote />);

    expect(
      screen.getByText(
        "Some changes from while you were offline didn’t apply, because the plan changed on another device.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(queue.dismissConflict).toHaveBeenCalledTimes(1);
  });
});
