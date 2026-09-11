import { Button } from "./ui/button";

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
