import type { ComponentType, ReactNode } from "react";
import OfflineLine from "./OfflineLine";
import { CalendarCheck, House, ListChecks, Plus, Settings2 } from "lucide-react";

// Bottom tab bar, ported from ../OneStepBeyondPrototype/src/components/efc/AppShell.tsx.
// That version derives the active tab from the router's current pathname
// (@tanstack/react-router); this app has no router yet (see CLAUDE.md's
// YAGNI guidance — nothing so far has needed one), so the active tab is
// plain lifted state instead.
export type Tab = "home" | "plan" | "assignments";

const TABS: { tab: Tab; label: string; icon: ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
  { tab: "home", label: "Home", icon: House },
  { tab: "plan", label: "Plan", icon: CalendarCheck },
  { tab: "assignments", label: "Assignments", icon: ListChecks },
];

type AppShellProps = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  // The trailing tab-bar slot (§1): quick-add on phones, Settings from
  // sm:. Both open App-level overlays, so they work from any tab — see
  // docs/decisions/20260924-secondary-screens-app-level-overlays.md.
  onQuickAdd: () => void;
  onOpenSettings: () => void;
  children: ReactNode;
};

// docs/features/mobile-app-shell-and-touch-ergonomics-v0.1.md §1. The shell
// owns the student app's single <main> landmark, its width, and its
// gutters — pages render a plain <div> root and never set their own max
// width or outer padding. Full width with 20px gutters on phones; a
// readable 2xl column from sm:; a bordered 5xl frame over a muted page
// from lg:. Safe-area insets keep content clear of the notch/status bar
// (top) and the home indicator (bottom, via the tab bar), which matters
// most once the app is launched standalone from the home screen (§7).
// The bottom padding and the tab bar's own height both come from
// --tab-bar-height (src/index.css), the same variable MobileActionBar
// uses for its sticky offset.
export default function AppShell({ activeTab, onTabChange, onQuickAdd, onOpenSettings, children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-background lg:bg-muted/40">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col bg-background pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom)+1.5rem)] lg:border-x lg:border-border">
        <main className="mx-auto w-full max-w-2xl flex-1 px-5 pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-8 sm:pt-[calc(2rem+env(safe-area-inset-top))] lg:px-10">
          <OfflineLine />
          {children}
        </main>
      </div>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto flex w-full max-w-2xl items-stretch px-2 sm:px-0">
          {TABS.map(({ tab, label, icon: Icon }) => {
            const active = tab === activeTab;
            return (
              <li key={tab} className="flex-1">
                <button
                  type="button"
                  onClick={() => onTabChange(tab)}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-(--tab-bar-height) w-full flex-col items-center justify-center gap-1 px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.2 : 1.6} />
                  {label}
                </button>
              </li>
            );
          })}
          {/* Phones: a raised 48px quick-add. Home's header hides its own +
              at this width (§2), so this is the one add button. */}
          <li className="flex items-center justify-center px-1 sm:hidden">
            <button
              type="button"
              aria-label="Add assignment"
              onClick={onQuickAdd}
              className="flex size-12 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-ring"
            >
              <Plus className="size-5" />
            </button>
          </li>
          {/* sm: and up: Settings in the same slot; Home's header shows its
              own + at this width instead. */}
          <li className="hidden items-center justify-center px-1 sm:flex">
            <button
              type="button"
              aria-label="Settings"
              onClick={onOpenSettings}
              className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
            >
              <Settings2 className="size-5" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
