import { describe, expect, it } from "vitest";
import {
  SWIPE_ACTION_WIDTH,
  canStartSwipe,
  detectIntent,
  dragOffset,
  settleOffset,
} from "./swipeGesture";

describe("detectIntent", () => {
  it("stays undecided below the threshold in both directions", () => {
    expect(detectIntent(6, 6)).toBe("undecided");
    expect(detectIntent(-6, 0)).toBe("undecided");
  });

  it("classifies mostly-horizontal movement as a swipe", () => {
    expect(detectIntent(-20, 5)).toBe("horizontal");
    expect(detectIntent(12, -3)).toBe("horizontal");
  });

  it("classifies mostly-vertical movement as a scroll", () => {
    expect(detectIntent(5, 20)).toBe("vertical");
    expect(detectIntent(-3, -12)).toBe("vertical");
  });

  it("gives an exact diagonal to scrolling, so scrolling wins ambiguous gestures", () => {
    expect(detectIntent(10, 10)).toBe("vertical");
  });
});

describe("dragOffset", () => {
  it("follows the finger leftwards from closed", () => {
    expect(dragOffset(0, -40)).toBe(-40);
  });

  it("never reveals past the action's width", () => {
    expect(dragOffset(0, -500)).toBe(-SWIPE_ACTION_WIDTH);
  });

  it("never moves right of closed", () => {
    expect(dragOffset(0, 30)).toBe(0);
  });

  it("starts from the open position when the row was already open", () => {
    expect(dragOffset(-SWIPE_ACTION_WIDTH, 30)).toBe(-SWIPE_ACTION_WIDTH + 30);
    expect(dragOffset(-SWIPE_ACTION_WIDTH, 500)).toBe(0);
  });
});

describe("settleOffset", () => {
  it("opens when released past halfway", () => {
    expect(settleOffset(-(SWIPE_ACTION_WIDTH / 2) - 1)).toBe(-SWIPE_ACTION_WIDTH);
  });

  it("snaps closed when released short of halfway", () => {
    expect(settleOffset(-(SWIPE_ACTION_WIDTH / 2) + 1)).toBe(0);
    expect(settleOffset(-SWIPE_ACTION_WIDTH / 2)).toBe(0);
  });

  it("closes an open row that was swiped back right past halfway", () => {
    expect(settleOffset(dragOffset(-SWIPE_ACTION_WIDTH, 60))).toBe(0);
  });
});

describe("canStartSwipe", () => {
  function el(html: string, selector: string): Element {
    const host = document.createElement("div");
    host.innerHTML = html;
    return host.querySelector(selector)!;
  }

  it("allows plain row content and buttons", () => {
    expect(canStartSwipe(el("<div><span>Title</span></div>", "span"))).toBe(true);
    expect(canStartSwipe(el("<button>Mon</button>", "button"))).toBe(true);
  });

  it("refuses text fields, including anything inside one", () => {
    expect(canStartSwipe(el('<input aria-label="Step 1" />', "input"))).toBe(false);
    expect(canStartSwipe(el("<textarea></textarea>", "textarea"))).toBe(false);
    expect(canStartSwipe(el("<select></select>", "select"))).toBe(false);
    expect(canStartSwipe(el('<div contenteditable="true"><b>x</b></div>', "b"))).toBe(false);
  });

  it("allows non-text inputs such as a status checkbox", () => {
    expect(canStartSwipe(el('<input type="checkbox" disabled />', "input"))).toBe(true);
    expect(canStartSwipe(el('<input type="radio" />', "input"))).toBe(true);
  });

  it("refuses drag handles and popup triggers (including their icons)", () => {
    expect(canStartSwipe(el('<button data-drag-handle><svg></svg></button>', "svg"))).toBe(false);
    expect(canStartSwipe(el('<button aria-haspopup="menu"><svg></svg></button>', "svg"))).toBe(false);
  });

  it("refuses anything inside a data-no-swipe region (e.g. a sideways-scrolling chip row)", () => {
    expect(
      canStartSwipe(el('<div data-no-swipe><button type="button">15:15</button></div>', "button")),
    ).toBe(false);
  });

  it("allows a non-element target", () => {
    expect(canStartSwipe(null)).toBe(true);
  });
});
