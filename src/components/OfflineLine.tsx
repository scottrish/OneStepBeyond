import { useSyncExternalStore } from "react";
import { QUEUED_NOTE, offlineLine } from "../domain/offlineWording";
import { useOfflineQueue } from "../hooks/useOfflineQueue";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { shownPlanSavedAt, subscribeOfflineCache } from "../services/offlineCache";

// "You're offline. Showing your plan from {time}." — once, at the top of
// every student screen, whenever the app is offline and has a plan to show
// (PWA phase 2, 2b; decision B1). With changes waiting to be saved (2c), it
// adds "Changes will be saved when you're back online." Calm, never red;
// announced politely.
export default function OfflineLine() {
  const online = useOnlineStatus();
  const savedAt = useSyncExternalStore(subscribeOfflineCache, shownPlanSavedAt, () => null);
  const { pending } = useOfflineQueue();

  const text = [savedAt ? offlineLine(savedAt, new Date()) : "You’re offline.", pending > 0 ? QUEUED_NOTE : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div aria-live="polite">
      {!online && (savedAt || pending > 0) && (
        <p className="mb-4 rounded-lg border border-border bg-card p-3 text-sm text-card-foreground">{text}</p>
      )}
    </div>
  );
}
