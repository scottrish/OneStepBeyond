import { useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

type ErrorBannerProps = {
  message: string;
  /** Present -> the "load error" shape (message + a retry button).
   *  Omitted -> the plain "action error" shape (just the message, no
   *  button) already used for inline save/delete failures that don't
   *  need their own retry affordance. */
  onRetry?: () => void;
  retryLabel?: string;
  /** Extra classes for the rare positioning tweak a specific call site
   *  needs (e.g. added top margin below other content) — merged onto
   *  the shared base classes, not a replacement for them. */
  className?: string;
};

// docs/decisions/20260911-architecture-refactor-proposal.md increment 3
// — the "load failed, here's a Try again button" / "here's what went
// wrong with that action" card, previously hand-rolled with byte-for-
// byte identical Tailwind classes independently in 15 files.
export default function ErrorBanner({ message, onRetry, retryLabel = "Try again", className = "" }: ErrorBannerProps) {
  const online = useOnlineStatus();
  const wasOffline = useRef(!online);

  // A load that failed because the device is offline tries again by itself
  // once the connection is back (PWA phase 2 — docs/features/
  // pwa-phase-2-offline-v0.1.md, 2a; decision O1).
  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      onRetry?.();
    }
  }, [online, onRetry]);

  // Offline, a load error isn't an error: say so calmly, without the red
  // border. A quiet Try again stays, for when the device never reports the
  // connection coming back (e.g. Wi-Fi without internet).
  if (onRetry && !online) {
    return (
      <div
        role="status"
        className={`mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3 text-card-foreground ${className}`}
      >
        <p className="min-w-0 flex-1 text-sm">
          You&rsquo;re offline. This will load when you&rsquo;re back online.
        </p>
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  if (!onRetry) {
    return (
      <p
        role="alert"
        className={`mb-4 rounded-lg border border-destructive bg-card p-3 text-sm text-card-foreground ${className}`}
      >
        {message}
      </p>
    );
  }

  return (
    <div
      role="alert"
      className={`mb-4 rounded-lg border border-destructive bg-card p-3 text-card-foreground ${className}`}
    >
      <p className="mb-2 text-sm">{message}</p>
      <Button onClick={onRetry}>{retryLabel}</Button>
    </div>
  );
}
