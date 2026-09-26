import { useSyncExternalStore } from "react";
import { offlineLine } from "../domain/offlineWording";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { shownPlanSavedAt, subscribeOfflineCache } from "../services/offlineCache";

// "You're offline. Showing your plan from {time}." — once, at the top of
// every student screen, whenever the app is offline and has a plan to show
// (PWA phase 2, 2b; decision B1). Calm, never red; announced politely.
export default function OfflineLine() {
  const online = useOnlineStatus();
  const savedAt = useSyncExternalStore(subscribeOfflineCache, shownPlanSavedAt, () => null);

  return (
    <div aria-live="polite">
      {!online && savedAt && (
        <p className="mb-4 rounded-lg border border-border bg-card p-3 text-sm text-card-foreground">
          {offlineLine(savedAt, new Date())}
        </p>
      )}
    </div>
  );
}
