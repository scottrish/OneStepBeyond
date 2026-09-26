import { isReachable } from "../lib/networkStatus";
import { defaultStore, type KeyValueStore } from "./offlineStore";

// The last-known plan (PWA phase 2, increment 2b — docs/features/
// pwa-phase-2-offline-v0.1.md; docs/decisions/20260925-pwa-phase-2-approach.md,
// W2). Reads the offline screens need go through cachedRead: a fresh
// result is kept on the device; if the server can't be reached, the last
// copy (up to 7 days old) is returned instead, and the app says so.
//
// Only the signed-in student's own data is ever kept. The supporter
// dashboard calls some of the same reads with the supported student's id;
// those are never stored on the supporter's device.

export const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const OWNER_KEY = "meta:owner";

type Entry = { data: unknown; savedAt: string };

let store: KeyValueStore = defaultStore();
let owner: string | null = null;
let ownerChecked: Promise<void> = Promise.resolve();
// Reads currently on screen from storage (key → when that copy was saved),
// and the last time anything was read fresh from the server.
const fromStorage = new Map<string, string>();
let lastFreshAt: string | null = null;
// Bumped whenever the store is cleared, so a save still in flight from
// before (e.g. a read that finishes just after sign-out) is dropped rather
// than putting the data back.
let generation = 0;
const listeners = new Set<() => void>();

// Actions made offline (2c) are shown on every read: the offline queue
// registers how. `mark` is taken before a read starts, so an action sent
// while the read was on its way is still shown even if the server's
// reply was assembled just before it arrived.
type ReadOverlay = {
  mark: () => number;
  apply: (key: string, data: unknown, since: number) => unknown;
};
let readOverlay: ReadOverlay = { mark: () => 0, apply: (_key, data) => data };

export function setReadOverlay(next: ReadOverlay): void {
  readOverlay = next;
}

function notify() {
  listeners.forEach((listener) => listener());
}

/** For tests: use an in-memory store and forget everything. */
export function resetOfflineCacheForTests(next: KeyValueStore): void {
  store = next;
  owner = null;
  ownerChecked = Promise.resolve();
  fromStorage.clear();
  lastFreshAt = null;
  generation += 1;
  notify();
}

/**
 * Who's signed in. Called by useAuth the moment it knows — before any
 * screen reads. If a different student's data is on the device, it's
 * cleared first.
 */
export function setCacheOwner(userId: string | null): void {
  owner = userId;
  if (!userId) return;
  ownerChecked = (async () => {
    try {
      const previous = await store.get(OWNER_KEY);
      if (previous !== userId) {
        // Changes the previous student made offline and never sent are
        // lost with the rest — noted, for debugging (question 2).
        const unsent = typeof previous === "string" ? await store.get(`${previous}:queue`) : undefined;
        if (Array.isArray(unsent) && unsent.length > 0) {
          console.info(`Offline: discarded ${unsent.length} unsent change(s) from a previous account.`);
        }
        // Saves for the new student wait for this (ownerChecked), and any
        // still in flight for the previous one fail the owner check.
        await store.clear();
        await store.put(OWNER_KEY, userId);
      }
    } catch {
      // Storage unavailable: nothing is kept, nothing to clear.
    }
  })();
}

/** On sign-out: nothing of this student stays on the device. */
export async function clearOfflineData(): Promise<void> {
  owner = null;
  generation += 1;
  fromStorage.clear();
  lastFreshAt = null;
  notify();
  try {
    await store.clear();
  } catch {
    // Storage unavailable: nothing was kept.
  }
}

/** Who's signed in, as far as offline data is concerned. */
export function currentOwner(): string | null {
  return owner;
}

/** Something the signed-in student keeps on the device (the offline queue). */
export async function loadOwned(studentId: string, key: string): Promise<unknown> {
  await ownerChecked;
  if (owner !== studentId) return undefined;
  return store.get(`${studentId}:${key}`).catch(() => undefined);
}

export async function saveOwned(studentId: string, key: string, value: unknown): Promise<void> {
  const startedIn = generation;
  await ownerChecked;
  if (generation !== startedIn || owner !== studentId) return;
  await store.put(`${studentId}:${key}`, value).catch(() => {});
}

// Only a network failure (the server wasn't reached) falls back to the
// stored copy — a server error while online still shows as an error.
function serverUnreachable(): boolean {
  return !isReachable() || (typeof navigator !== "undefined" && navigator.onLine === false);
}

export async function cachedRead<T>(studentId: string, key: string, fetcher: () => Promise<T>): Promise<T> {
  const fullKey = `${studentId}:${key}`;
  const mine = owner !== null && studentId === owner;
  const since = readOverlay.mark();
  const shown = (data: T): T => (mine ? (readOverlay.apply(key, data, since) as T) : data);
  try {
    const data = await fetcher();
    lastFreshAt = new Date().toISOString();
    if (fromStorage.delete(fullKey)) notify();
    if (mine) {
      const entry: Entry = { data, savedAt: lastFreshAt };
      const startedIn = generation;
      void ownerChecked
        .then(() => (generation === startedIn && owner === studentId ? store.put(fullKey, entry) : undefined))
        .catch(() => {});
    }
    return shown(data);
  } catch (error) {
    if (mine && serverUnreachable()) {
      await ownerChecked;
      const entry = (await store.get(fullKey).catch(() => undefined)) as Entry | undefined;
      if (entry && Date.now() - Date.parse(entry.savedAt) <= MAX_AGE_MS) {
        fromStorage.set(fullKey, entry.savedAt);
        notify();
        return shown(entry.data as T);
      }
    }
    throw error;
  }
}

/**
 * A read with no student id of its own (Assignment Detail's), kept for
 * the signed-in student. Only student screens make these reads.
 */
export function ownRead<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  return owner ? cachedRead(owner, key, fetcher) : fetcher();
}

/**
 * When the plan on screen is from: the oldest stored copy being shown, or
 * — if nothing on screen came from storage — the last fresh read. Null if
 * there's nothing to show.
 */
export function shownPlanSavedAt(): string | null {
  if (fromStorage.size > 0) return [...fromStorage.values()].sort()[0]!;
  return lastFreshAt;
}

export function subscribeOfflineCache(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
