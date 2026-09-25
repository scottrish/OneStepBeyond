import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// A calm, inline, dismissable explanation of why an action was refused
// (e.g. a retime that would overlap, a reorder that would run past
// midnight) — the action changed nothing, so this isn't an ErrorBanner.
export default function DismissableAlert({
  message,
  onDismiss,
  className,
}: {
  message: string;
  onDismiss: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "mb-3 flex items-start gap-2 rounded-2xl bg-attention px-3 py-2 text-xs text-attention-foreground",
        className,
      )}
    >
      <span className="flex-1 py-1">{message}</span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Dismiss"
        className="-my-2 -mr-2 shrink-0 rounded-full"
        onClick={onDismiss}
      >
        <X aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}
