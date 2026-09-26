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

// Only a network failure (the server wasn't reached) falls back to the
// stored copy — a server error while online still shows as an error.
function serverUnreachable(): boolean {
  return !isReachable() || (typeof navigator !== "undefined" && navigator.onLine === false);
}

export async function cachedRead<T>(studentId: string, key: string, fetcher: () => Promise<T>): Promise<T> {
  const fullKey = `${studentId}:${key}`;
  const mine = owner !== null && studentId === owner;
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
    return data;
  } catch (error) {
    if (mine && serverUnreachable()) {
      await ownerChecked;
      const entry = (await store.get(fullKey).catch(() => undefined)) as Entry | undefined;
      if (entry && Date.now() - Date.parse(entry.savedAt) <= MAX_AGE_MS) {
        fromStorage.set(fullKey, entry.savedAt);
        notify();
        return entry.data as T;
      }
    }
    throw error;
  }
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
