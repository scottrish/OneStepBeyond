// A tiny key–value store for offline data (PWA phase 2, increment 2b —
// docs/features/pwa-phase-2-offline-v0.1.md; decision B2): IndexedDB in
// the browser, or memory where IndexedDB isn't available (tests, some
// private modes). Only src/services/offlineCache.ts uses it.

export type KeyValueStore = {
  get(key: string): Promise<unknown>;
  put(key: string, value: unknown): Promise<void>;
  clear(): Promise<void>;
};

export function memoryStore(): KeyValueStore {
  const items = new Map<string, unknown>();
  return {
    get: async (key) => items.get(key),
    put: async (key, value) => {
      items.set(key, value);
    },
    clear: async () => {
      items.clear();
    },
  };
}

const DB_NAME = "osb-offline";
const STORE = "reads";

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function indexedDbStore(): KeyValueStore {
  let db: Promise<IDBDatabase> | null = null;
  const open = () => {
    db ??= new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return db;
  };
  const objectStore = async (mode: IDBTransactionMode) =>
    (await open()).transaction(STORE, mode).objectStore(STORE);

  return {
    get: async (key) => request((await objectStore("readonly")).get(key)),
    put: async (key, value) => {
      await request((await objectStore("readwrite")).put(value, key));
    },
    clear: async () => {
      await request((await objectStore("readwrite")).clear());
    },
  };
}

export function defaultStore(): KeyValueStore {
  return typeof indexedDB === "undefined" ? memoryStore() : indexedDbStore();
}
