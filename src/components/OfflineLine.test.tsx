import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import OfflineLine from "./OfflineLine";
import { memoryStore } from "../services/offlineStore";
import { cachedRead, resetOfflineCacheForTests, setCacheOwner } from "../services/offlineCache";

function setOnline(online: boolean) {
  Object.defineProperty(navigator, "onLine", { value: online, configurable: true });
  act(() => {
    window.dispatchEvent(new Event(online ? "online" : "offline"));
  });
}

async function storePlanThenReadOffline() {
  setCacheOwner("s1");
  await cachedRead("s1", "courses", async () => ["Biology"]);
  await new Promise((resolve) => setTimeout(resolve, 0));
  Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
  await act(async () => {
    await cachedRead("s1", "courses", () => Promise.reject(new Error("AbortError: You're offline.")));
  });
}

describe("OfflineLine (PWA phase 2, 2b; decision B1)", () => {
  beforeEach(() => {
    resetOfflineCacheForTests(memoryStore());
  });

  afterEach(() => {
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  it("offline with a stored plan: says so once, calmly, with when it's from", async () => {
    render(<OfflineLine />);
    await storePlanThenReadOffline();
    setOnline(false);

    expect(screen.getByText(/^You’re offline\. Showing your plan from .+\.$/)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("online: nothing", async () => {
    render(<OfflineLine />);
    setOnline(true);
    expect(screen.queryByText(/you’re offline/i)).not.toBeInTheDocument();
  });

  it("offline with nothing stored: nothing (the screen's own offline message covers it)", () => {
    render(<OfflineLine />);
    setOnline(false);
    expect(screen.queryByText(/showing your plan/i)).not.toBeInTheDocument();
  });
});
