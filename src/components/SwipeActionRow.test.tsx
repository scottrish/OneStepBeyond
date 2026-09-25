import { useContext } from "react";
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import SwipeActionRow from "./SwipeActionRow";
import SwipeRowProvider from "./SwipeRowProvider";
import { SwipeRowContext } from "./swipeRowContext";

// Drives a touch gesture on the row's swipe surface (the element holding
// the pointer handlers), starting from `from` inside the row.
function swipe(from: Element, dx: number, dy = 0) {
  const surface = from.closest("[data-swipe-content]")!;
  const start = { clientX: 300, clientY: 100, pointerId: 1, pointerType: "touch" };
  fireEvent.pointerDown(from, start);
  const steps = 5;
  for (let i = 1; i <= steps; i++) {
    fireEvent.pointerMove(surface, {
      ...start,
      clientX: start.clientX + (dx * i) / steps,
      clientY: start.clientY + (dy * i) / steps,
    });
  }
  fireEvent.pointerUp(surface, { ...start, clientX: start.clientX + dx, clientY: start.clientY + dy });
}

function offsetOf(from: Element): string {
  return (from.closest("[data-swipe-content]") as HTMLElement).style.transform;
}

// Lets the post-gesture click-swallow flag clear (it resets on a 0ms timer).
async function flush() {
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
}

function Row({
  id = "row-1",
  label = "Biology lab report",
  onAction = vi.fn(),
  onRowClick = vi.fn(),
}: {
  id?: string;
  label?: string;
  onAction?: () => void;
  onRowClick?: () => void;
}) {
  return (
    <SwipeActionRow id={id} label={label} actionLabel="Delete" onAction={onAction}>
      <div>
        <button type="button" onClick={onRowClick}>
          Open {label}
        </button>
        <input aria-label={`Title of ${label}`} defaultValue={label} />
        <button type="button" aria-haspopup="menu">
          More actions for {label}
        </button>
      </div>
    </SwipeActionRow>
  );
}

describe("SwipeActionRow", () => {
  it("keeps the action out of the accessibility tree and tab order while closed", () => {
    render(<Row />);

    expect(screen.queryByRole("button", { name: "Delete Biology lab report" })).not.toBeInTheDocument();
    // Testing Library computes no accessible name for aria-hidden
    // elements, so find it by its label attribute instead.
    const hidden = screen
      .getAllByRole("button", { hidden: true })
      .find((button) => button.getAttribute("aria-label") === "Delete Biology lab report")!;
    expect(hidden).toHaveAttribute("aria-hidden", "true");
    expect(hidden).toHaveAttribute("tabindex", "-1");
  });

  it("reveals the action when swiped left past halfway", () => {
    render(<Row />);
    const row = screen.getByRole("button", { name: /^open biology/i });

    swipe(row, -80);

    expect(offsetOf(row)).toBe("translateX(-104px)");
    const action = screen.getByRole("button", { name: "Delete Biology lab report" });
    expect(action).not.toHaveAttribute("aria-hidden", "true");
    expect(action).toHaveAttribute("tabindex", "0");
  });

  it("snaps back closed when released short of halfway", () => {
    render(<Row />);
    const row = screen.getByRole("button", { name: /^open biology/i });

    swipe(row, -40);

    expect(offsetOf(row)).toBe("translateX(0px)");
    expect(screen.queryByRole("button", { name: "Delete Biology lab report" })).not.toBeInTheDocument();
  });

  it("leaves mostly-vertical movement to the page (a scroll never opens the row)", () => {
    render(<Row />);
    const row = screen.getByRole("button", { name: /^open biology/i });

    swipe(row, -60, 120);

    expect(offsetOf(row)).toBe("translateX(0px)");
  });

  it("never starts a swipe inside a text field", () => {
    render(<Row />);
    const input = screen.getByRole("textbox", { name: /title of biology/i });

    swipe(input, -90);

    expect(offsetOf(input)).toBe("translateX(0px)");
  });

  it("never starts a swipe on a menu trigger", () => {
    render(<Row />);
    const trigger = screen.getByRole("button", { name: /more actions for biology/i });

    swipe(trigger, -90);

    expect(offsetOf(trigger)).toBe("translateX(0px)");
  });

  it("swallows the click that ends a swipe, without clicking the button under it or closing the row", async () => {
    const onRowClick = vi.fn();
    render(<Row onRowClick={onRowClick} />);
    const row = screen.getByRole("button", { name: /^open biology/i });

    swipe(row, -80);
    fireEvent.click(row); // the click a real browser dispatches after pointerup

    expect(onRowClick).not.toHaveBeenCalled();
    expect(offsetOf(row)).toBe("translateX(-104px)");
    await flush();
  });

  it("runs onAction and closes when the revealed action is tapped", () => {
    const onAction = vi.fn();
    render(<Row onAction={onAction} />);
    const row = screen.getByRole("button", { name: /^open biology/i });
    swipe(row, -80);

    fireEvent.click(screen.getByRole("button", { name: "Delete Biology lab report" }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(offsetOf(row)).toBe("translateX(0px)");
  });

  it("tapping an open row's content only closes it", async () => {
    const onRowClick = vi.fn();
    render(<Row onRowClick={onRowClick} />);
    const row = screen.getByRole("button", { name: /^open biology/i });
    swipe(row, -80);
    await flush();

    fireEvent.click(row);

    expect(onRowClick).not.toHaveBeenCalled();
    expect(offsetOf(row)).toBe("translateX(0px)");
  });

  it("tapping a menu trigger on an open row only closes the row", async () => {
    render(<Row />);
    const row = screen.getByRole("button", { name: /^open biology/i });
    swipe(row, -80);
    await flush();

    const trigger = screen.getByRole("button", { name: /more actions for biology/i });
    const pointerDown = fireEvent.pointerDown(trigger, { pointerType: "touch", pointerId: 2 });

    // preventDefault is what stops Radix, which opens menus on pointerdown.
    expect(pointerDown).toBe(false);
    expect(offsetOf(row)).toBe("translateX(0px)");
  });

  it("closes an open row when swiped back right", async () => {
    render(<Row />);
    const row = screen.getByRole("button", { name: /^open biology/i });
    swipe(row, -80);
    await flush();

    swipe(row, 90);

    expect(offsetOf(row)).toBe("translateX(0px)");
  });

  it("closes the open action with Escape", () => {
    render(<Row />);
    const row = screen.getByRole("button", { name: /^open biology/i });
    swipe(row, -80);

    fireEvent.keyDown(screen.getByRole("button", { name: "Delete Biology lab report" }), { key: "Escape" });

    expect(offsetOf(row)).toBe("translateX(0px)");
  });

  it("keeps at most one row open across the app", () => {
    render(
      <SwipeRowProvider>
        <Row id="a" label="Biology lab report" />
        <Row id="b" label="History essay" />
      </SwipeRowProvider>,
    );
    const first = screen.getByRole("button", { name: /^open biology/i });
    const second = screen.getByRole("button", { name: /^open history/i });

    swipe(first, -80);
    expect(offsetOf(first)).toBe("translateX(-104px)");

    swipe(second, -80);
    expect(offsetOf(second)).toBe("translateX(-104px)");
    expect(offsetOf(first)).toBe("translateX(0px)");
  });

  it("forgets its open state when unmounted", () => {
    function OpenId() {
      return <output aria-label="open row">{useContext(SwipeRowContext)?.openId ?? "none"}</output>;
    }
    const { rerender } = render(
      <SwipeRowProvider>
        <Row id="a" />
        <OpenId />
      </SwipeRowProvider>,
    );
    swipe(screen.getByRole("button", { name: /^open biology/i }), -80);
    expect(screen.getByRole("status", { name: "open row" })).toHaveTextContent("a");

    rerender(
      <SwipeRowProvider>
        <OpenId />
      </SwipeRowProvider>,
    );

    expect(screen.getByRole("status", { name: "open row" })).toHaveTextContent("none");
  });

  it("renders just its children when disabled", () => {
    render(
      <SwipeActionRow id="x" label="Done step" actionLabel="Delete" onAction={vi.fn()} disabled>
        <p>Done step</p>
      </SwipeActionRow>,
    );

    expect(screen.getByText("Done step")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i, hidden: true })).not.toBeInTheDocument();
  });
});
