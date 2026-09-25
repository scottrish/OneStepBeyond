import { useRef, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type ResponsiveSheetProps = {
  open: boolean;
  // Called with false for every close route — backdrop tap, Escape, the
  // close button, and (on touch) swiping the sheet away. Each caller
  // decides what that "cancel" means (e.g. execution-coaching-v0.1.md
  // records a dismissal when its intervention sheet is closed).
  onOpenChange: (open: boolean) => void;
  // Required: rendered as the dialog's accessible name.
  title: string;
  // Optional: rendered as the dialog's accessible description.
  description?: string;
  children: ReactNode;
};

// docs/features/mobile-app-shell-and-touch-ergonomics-v0.1.md §3 — the one
// surface for secondary decisions and confirmations. A bottom sheet below
// sm: (rounded top, grab handle, max 88dvh with internal scroll, safe-area
// bottom padding); a centered dialog from sm:. Focus trap, Escape, and
// focus return come from Radix Dialog (via ui/sheet).
//
// Not used by any screen in this increment: its first callers are the
// Today coaching and Plan edit-sheet specs. Built and tested here so they
// start from a finished primitive.
export default function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: ResponsiveSheetProps) {
  // Radix only returns focus automatically to its own Dialog.Trigger, but
  // callers open this sheet from their own buttons (controlled `open`).
  // Remember whatever had focus when it opened and restore it on close, so
  // keyboard and screen-reader users land back where they were (§3).
  const returnFocusTo = useRef<HTMLElement | null>(null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        onOpenAutoFocus={() => {
          returnFocusTo.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }}
        onCloseAutoFocus={(event) => {
          const target = returnFocusTo.current;
          if (target && target.isConnected) {
            event.preventDefault();
            target.focus();
          }
          returnFocusTo.current = null;
        }}
        // Radix warns when no Description is present; opting out explicitly
        // is the documented way to say "none" when a caller omits one.
        {...(description ? {} : { "aria-describedby": undefined })}
        className="max-h-[88dvh] overflow-y-auto rounded-t-3xl border-border px-5 pt-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:pb-6"
      >
        <div aria-hidden="true" className="mx-auto mb-5 h-1 w-10 rounded-full bg-muted-foreground/30 sm:hidden" />
        <SheetHeader className="pr-10 text-left">
          <SheetTitle className="font-display text-xl">{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="mt-5">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
