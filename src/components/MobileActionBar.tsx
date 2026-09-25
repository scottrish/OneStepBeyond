import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MobileActionBarProps = {
  children: ReactNode;
  className?: string;
};

// docs/features/mobile-app-shell-and-touch-ergonomics-v0.1.md §3 — keeps a
// screen's primary action in thumb reach without scrolling. Sticks to the
// bottom of the page's scrolling content, just above the fixed tab bar:
// its offset is the same --tab-bar-height variable AppShell uses (never a
// separately hardcoded value), plus the bottom safe-area inset. Full-bleed
// on phones (the negative margin cancels AppShell's 20px gutter); a
// bordered, rounded card within the content column from sm:.
//
// Relies on the page scrolling on the viewport, not inside an inner
// overflow container — AppShell guarantees this (§1). AppShell's own
// bottom padding keeps the last list row from sitting permanently behind
// the bar (WCAG 2.4.11).
export default function MobileActionBar({ children, className }: MobileActionBarProps) {
  return (
    <div
      className={cn(
        "sticky bottom-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))] z-20 -mx-5 mt-6 border-t border-border bg-background/95 px-5 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-3",
        className,
      )}
    >
      <div className="flex gap-2">{children}</div>
    </div>
  );
}
