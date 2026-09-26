// A new version of the app waiting to take over (PWA phase 2 — docs/
// features/pwa-phase-2-offline-v0.1.md, 2a; decision W4). The service
// worker downloads it in the background; Home offers "Refresh", and
// otherwise it takes over the next time the app is opened. Nothing
// reloads by itself.

let ready = false;
// "Later": hidden until the app is next opened (decision O2), so this
// lives in memory only.
let dismissed = false;
let apply: (() => void) | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

/** Called by the service worker registration when a new version is waiting. */
export function setUpdateReady(applyUpdate: () => void): void {
  ready = true;
  apply = applyUpdate;
  notify();
}

/** Whether Home should offer the update right now. */
export function isUpdateOffered(): boolean {
  return ready && !dismissed;
}

export function applyUpdate(): void {
  apply?.();
}

export function dismissUpdate(): void {
  dismissed = true;
  notify();
}

export function subscribeUpdate(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
