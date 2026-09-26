import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { applyUpdate, dismissUpdate, isUpdateOffered, subscribeUpdate } from "../../lib/pwaUpdateStore";

// "A new version is ready." (docs/features/pwa-phase-2-offline-v0.1.md,
// 2a; decision W4). Only on Home, so it never appears mid-flow; a polite
// live region that never takes focus. Refresh loads the new version now;
// Later hides it until the app is next opened (O2), when the new version
// takes over by itself.
export default function UpdateNote() {
  const offered = useSyncExternalStore(subscribeUpdate, isUpdateOffered, () => false);

  return (
    <div aria-live="polite">
      {offered && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
          <p className="min-w-0 flex-1 text-sm text-foreground">A new version is ready.</p>
          <div className="flex gap-2">
            <Button size="sm" className="rounded-xl" onClick={applyUpdate}>
              Refresh
            </Button>
            <Button size="sm" variant="ghost" className="rounded-xl" onClick={dismissUpdate}>
              Later
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
