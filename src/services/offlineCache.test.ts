import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_AGE_MS,
  cachedRead,
  clearOfflineData,
  ownRead,
  peekOwnRead,
  peekRead,
  resetOfflineCacheForTests,
  setCacheOwner,
  shownPlanSavedAt,
} from "./offlineCache";
import { memoryStore, type KeyValueStore } from "./offlineStore";
import { reachabilityFetch } from "../lib/networkStatus";

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

describe("the in-memory copy for instant screens (instant-screen-data-v0.1.md)", () => {
  // A save, as the Supabase client's fetch wrapper sees one.
  const save = () =>
    reachabilityFetch(() => Promise.resolve(new Response("ok")))("https://x.supabase.co/rest/v1/courses", {
      method: "POST",
    });

  it("a fresh read is kept, and can be looked at synchronously", async () => {
    setCacheOwner("s1");
    expect(peekRead("s1", "courses")).toBeUndefined();
    await cachedRead("s1", "courses", async () => ["Biology"]);
    expect(peekRead("s1", "courses")).toEqual(["Biology"]);
  });

  it("never for another student (the supporter dashboard)", async () => {
    setCacheOwner("s1");
    await cachedRead("someone-else", "courses", async () => ["Theirs"]);
    expect(peekRead("someone-else", "courses")).toBeUndefined();
  });

  it("Assignment Detail's own reads too", async () => {
    setCacheOwner("s1");
    await ownRead("assignment:a1", async () => ({ id: "a1" }));
    expect(peekOwnRead("assignment:a1")).toEqual({ id: "a1" });
  });

  it("any save drops every copy (I4)", async () => {
    setCacheOwner("s1");
    await cachedRead("s1", "courses", async () => ["Biology"]);
    await cachedRead("s1", "activities", async () => ["Soccer"]);
    await save();
    expect(peekRead("s1", "courses")).toBeUndefined();
    expect(peekRead("s1", "activities")).toBeUndefined();
  });

  it("a read that was on its way when a save started isn't kept — it may predate the save (F1)", async () => {
    setCacheOwner("s1");
    let finish: (value: string[]) => void = () => {};
    const reading = cachedRead("s1", "courses", () => new Promise<string[]>((resolve) => (finish = resolve)));
    await save();
    finish(["from before the save"]);
    await reading;
    expect(peekRead("s1", "courses")).toBeUndefined();
  });

  it("signing out, or another student, drops the copies; the same student keeps them", async () => {
    setCacheOwner("s1");
    await cachedRead("s1", "courses", async () => ["Biology"]);
    setCacheOwner("s1");
    expect(peekRead("s1", "courses")).toEqual(["Biology"]);

    setCacheOwner("s2");
    setCacheOwner("s1");
    expect(peekRead("s1", "courses")).toBeUndefined();

    await cachedRead("s1", "courses", async () => ["Biology"]);
    await clearOfflineData();
    setCacheOwner("s1");
    expect(peekRead("s1", "courses")).toBeUndefined();
  });

  it("offline, the stored copy isn't mistaken for a fresh one", async () => {
    setCacheOwner("s1");
    await cachedRead("s1", "courses", async () => ["Biology"]);
    await save();
    offline();
    expect(await cachedRead("s1", "courses", networkDown)).toEqual(["Biology"]);
    expect(peekRead("s1", "courses")).toBeUndefined();
  });
});

