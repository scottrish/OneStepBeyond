import { afterEach, describe, expect, it, vi } from "vitest";
import { isReachable, reachabilityFetch } from "./networkStatus";

afterEach(async () => {
  Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  // Leave the shared flag "reachable" for other tests.
  await reachabilityFetch(() => Promise.resolve(new Response("ok")))("https://example.test");
});

describe("reachabilityFetch (PWA phase 2)", () => {
  it("fails at once, as an AbortError Supabase won't retry, when the browser knows it's offline", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const base = vi.fn();

    await expect(reachabilityFetch(base)("https://example.test")).rejects.toMatchObject({ name: "AbortError" });
    expect(base).not.toHaveBeenCalled();
    expect(isReachable()).toBe(false);
  });

  it("notes an unreachable server when a request fails, and a reachable one when it succeeds", async () => {
    await expect(
      reachabilityFetch(() => Promise.reject(new TypeError("Failed to fetch")))("https://example.test"),
    ).rejects.toThrow("Failed to fetch");
    expect(isReachable()).toBe(false);

    await reachabilityFetch(() => Promise.resolve(new Response("ok", { status: 500 })))("https://example.test");
    // Any response — even an error status — means the server was reached.
    expect(isReachable()).toBe(true);
  });

  it("a request the app cancelled itself doesn't count as offline", async () => {
    await expect(
      reachabilityFetch(() => Promise.reject(new DOMException("cancelled", "AbortError")))("https://example.test"),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(isReachable()).toBe(true);
  });

  it("the browser saying the connection is back clears the unreachable mark, so screens retry", async () => {
    await expect(
      reachabilityFetch(() => Promise.reject(new TypeError("Failed to fetch")))("https://example.test"),
    ).rejects.toThrow();
    expect(isReachable()).toBe(false);

    window.dispatchEvent(new Event("online"));

    expect(isReachable()).toBe(true);
  });
});
