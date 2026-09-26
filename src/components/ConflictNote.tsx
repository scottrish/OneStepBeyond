import { Button } from "@/components/ui/button";
import { CONFLICT_NOTE } from "../domain/offlineWording";
import { useOfflineQueue } from "../hooks/useOfflineQueue";

// Told once, calmly, when a change made offline didn't apply because the
// plan changed on another device (PWA phase 2, 2c; decision Q3). It sits
// at the top of the screen, so it never interrupts an open sheet or check,
// and stays until the student taps OK.
export default function ConflictNote() {
  const { conflict, dismissConflict } = useOfflineQueue();

  return (
    <div aria-live="polite">
      {conflict && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-sm text-card-foreground">
          <p className="flex-1">{CONFLICT_NOTE}</p>
          <Button variant="ghost" size="sm" className="min-h-11 shrink-0 px-4" onClick={dismissConflict}>
            OK
          </Button>
        </div>
      )}
    </div>
  );
}
