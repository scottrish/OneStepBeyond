// Whether requests are reaching the server (PWA phase 2 — docs/features/
// pwa-phase-2-offline-v0.1.md, 2a). The browser's navigator.onLine isn't
// enough on its own: it can say "online" with no internet (Wi-Fi without
// a connection, or right after a page loads offline). So every Supabase
// request goes through reachabilityFetch, which notes whether it got a
// response; the app counts as online only when both agree.

let reachable = true;
const listeners = new Set<() => void>();

function set(next: boolean) {
  if (next === reachable) return;
  reachable = next;
  listeners.forEach((listener) => listener());
}

// When the browser says the connection is back — or the student returns
// to the app while it says it's online — assume the server may be
// reachable again. Screens waiting on the connection then retry; if it
// still isn't reachable, the first failed request says so again.
if (typeof window !== "undefined") {
  window.addEventListener("online", () => set(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && navigator.onLine) set(true);
  });
}

// ——— Saves (docs/features/instant-screen-data-v0.1.md) ———
// Every request that writes to the database — anything but a read to the
// database API; sign-in and token requests don't count — is counted here,
// as it starts. The in-memory copies of the student's reads are dropped
// on each (I4), and a read that started before a save knows its answer
// may predate it (F1).

let writes = 0;
const writeListeners = new Set<() => void>();

function isDatabaseWrite(input: RequestInfo | URL, init?: RequestInit): boolean {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  return url.includes("/rest/v1/") && method !== "GET" && method !== "HEAD";
}

/** How many saves have started this session. Compare before and after a read. */
export function writeCount(): number {
  return writes;
}

export function subscribeWrites(listener: () => void): () => void {
  writeListeners.add(listener);
  return () => writeListeners.delete(listener);
}

function noteWrite() {
  writes += 1;
  writeListeners.forEach((listener) => listener());
}

export function isReachable(): boolean {
  return reachable;
}

export function subscribeReachability(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * A fetch for the Supabase client. When the browser knows it's offline it
 * fails at once — as an AbortError, which Supabase doesn't retry — instead
 * of retrying for several seconds. Otherwise it fetches as normal and
 * records whether the server was reached.
 */
export function reachabilityFetch(baseFetch: typeof fetch = (...args) => fetch(...args)): typeof fetch {
  return async (input, init) => {
    if (isDatabaseWrite(input, init)) noteWrite();
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      set(false);
      throw new DOMException("You're offline.", "AbortError");
    }
    try {
      const response = await baseFetch(input, init);
      set(true);
      return response;
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) set(false);
      throw error;
    }
  };
}
