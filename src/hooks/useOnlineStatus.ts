import { useSyncExternalStore } from "react";
import { isReachable, subscribeReachability } from "../lib/networkStatus";

// Whether the app can reach the server: the browser says it's online, and
// the last request got through (see src/lib/networkStatus.ts — the
// browser's own flag can say "online" with no internet). PWA phase 2,
// docs/features/pwa-phase-2-offline-v0.1.md.
function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  const unsubscribe = subscribeReachability(onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
    unsubscribe();
  };
}

const isOnline = () => navigator.onLine && isReachable();

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, isOnline, () => true);
}
