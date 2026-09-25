import { describe, expect, it } from "vitest";
import { cancelled, droppedAt, movedTo, pickedUp } from "./sortAnnouncements";

const rows = [
  { id: "id-a", title: "Read chapter 3" },
  { id: "id-b", title: "Outline essay" },
  { id: "id-c", title: "Lab write-up" },
  { id: "id-d", title: "Flashcards" },
];

describe("sortAnnouncements", () => {
  it("announces pick-up with the row's title and position", () => {
    expect(pickedUp(rows, "id-b")).toBe("Picked up Outline essay. Position 2 of 4.");
  });

  it("announces moves and drops by title and the target position", () => {
    expect(movedTo(rows, "id-b", "id-c")).toBe("Outline essay moved to position 3 of 4.");
    expect(droppedAt(rows, "id-b", "id-c")).toBe("Outline essay dropped at position 3 of 4.");
  });

  it("says the order is unchanged when dropped outside the list or cancelled", () => {
    expect(droppedAt(rows, "id-a", undefined)).toBe("Read chapter 3 dropped. Order unchanged.");
    expect(cancelled(rows, "id-a")).toBe("Moving Read chapter 3 was cancelled. Order unchanged.");
  });

  it("never includes an internal id", () => {
    const all = [
      pickedUp(rows, "id-a"),
      movedTo(rows, "id-a", "id-d"),
      droppedAt(rows, "id-a", "id-d"),
      cancelled(rows, "id-a"),
    ].join(" ");
    expect(all).not.toMatch(/id-/);
  });
});
