import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_AGE_MS,
  cachedRead,
  clearOfflineData,
  resetOfflineCacheForTests,
  setCacheOwner,
  shownPlanSavedAt,
} from "./offlineCache";
import { memoryStore, type KeyValueStore } from "./offlineStore";

// PWA phase 2, increment 2b (docs/features/pwa-phase-2-offline-v0.1.md).

let store: KeyValueStore;
const offline = () => Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
const online = () => Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
const networkDown = () => Promise.reject(new Error("TypeError: Failed to fetch"));

beforeEach(() => {
  store = memoryStore();
  resetOfflineCacheForTests(store);
  online();
});

afterEach(() => {
  online();
  vi.useRealTimers();
});

describe("cachedRead", () => {
  it("offline, returns the student's last stored copy and says when it's from", async () => {
    setCacheOwner("s1");
    expect(await cachedRead("s1", "assignments", async () => ["fresh"])).toEqual(["fresh"]);
    await Promise.resolve();

    offline();
    expect(await cachedRead("s1", "assignments", networkDown)).toEqual(["fresh"]);
    expect(shownPlanSavedAt()).not.toBeNull();
  });

  it("never stores another student's data (a supporter's dashboard reads)", async () => {
    setCacheOwner("supporter");
    await cachedRead("student-9", "assignments", async () => ["private"]);
    await Promise.resolve();

    offline();
    await expect(cachedRead("student-9", "assignments", networkDown)).rejects.toThrow();
    expect(await store.get("student-9:assignments")).toBeUndefined();
  });

  it("a server error while online still fails — it doesn't quietly show old data", async () => {
    setCacheOwner("s1");
    await cachedRead("s1", "courses", async () => ["old"]);
    await Promise.resolve();

    await expect(cachedRead("s1", "courses", () => Promise.reject(new Error("permission denied")))).rejects.toThrow(
      "permission denied",
    );
  });

  it("doesn't show a copy older than 7 days", async () => {
    setCacheOwner("s1");
    await store.put("s1:courses", { data: ["ancient"], savedAt: new Date(Date.now() - MAX_AGE_MS - 60_000).toISOString() });

    offline();
    await expect(cachedRead("s1", "courses", networkDown)).rejects.toThrow();
  });

  it("with nothing stored, offline fails as before (2a's message shows)", async () => {
    setCacheOwner("s1");
    offline();
    await expect(cachedRead("s1", "courses", networkDown)).rejects.toThrow();
  });

  it("a fresh read after coming back replaces the stored one on screen", async () => {
    setCacheOwner("s1");
    await cachedRead("s1", "courses", async () => ["a"]);
    await Promise.resolve();
    offline();
    await cachedRead("s1", "courses", networkDown);
    const storedFrom = shownPlanSavedAt();

    online();
    await new Promise((resolve) => setTimeout(resolve, 5));
    await cachedRead("s1", "courses", async () => ["b"]);
    expect(shownPlanSavedAt()! > storedFrom!).toBe(true);
  });
});

describe("clearing", () => {
  it("signing out clears everything", async () => {
    setCacheOwner("s1");
    await cachedRead("s1", "courses", async () => ["a"]);
    await Promise.resolve();

    await clearOfflineData();

    expect(await store.get("s1:courses")).toBeUndefined();
    expect(shownPlanSavedAt()).toBeNull();
  });

  it("a different student signing in on the device clears the previous student's data", async () => {
    setCacheOwner("s1");
    await cachedRead("s1", "courses", async () => ["s1's"]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    setCacheOwner("s2");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(await store.get("s1:courses")).toBeUndefined();
  });

  it("the same student signing in again keeps their data", async () => {
    setCacheOwner("s1");
    await cachedRead("s1", "courses", async () => ["mine"]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    setCacheOwner("s1");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(await store.get("s1:courses")).toMatchObject({ data: ["mine"] });
  });

  it("a new student's first reads are stored, even while the previous student's data is being cleared", async () => {
    setCacheOwner("s1");
    await cachedRead("s1", "courses", async () => ["s1's"]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    setCacheOwner("s2");
    await cachedRead("s2", "courses", async () => ["s2's"]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(await store.get("s1:courses")).toBeUndefined();
    expect(await store.get("s2:courses")).toMatchObject({ data: ["s2's"] });
  });
});
