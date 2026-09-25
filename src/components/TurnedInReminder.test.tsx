import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TurnedInReminder from "./TurnedInReminder";

describe("TurnedInReminder", () => {
  it("shows the reminder with the assignment's title and one Got it button", async () => {
    const onDone = vi.fn();
    render(<TurnedInReminder title="Lab report" onDone={onDone} />);

    expect(screen.getByText("One last thing")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mark it turned in at school" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Nicely done — “Lab report” is marked complete here. Remember to also mark it as turned in or complete in whatever your school uses to track assignments.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);

    await userEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
