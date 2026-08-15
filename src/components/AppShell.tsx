import type { ComponentType, ReactNode } from "react";
import { CalendarCheck, House, ListChecks } from "lucide-react";

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
  children: ReactNode;
};

export default function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col bg-background pb-24 shadow-[0_0_80px_-40px_rgba(0,0,0,0.25)]">
        <main className="flex-1">{children}</main>
      </div>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 backdrop-blur"
      >
        <ul className="mx-auto flex w-full max-w-[420px] items-stretch">
          {TABS.map(({ tab, label, icon: Icon }) => {
            const active = tab === activeTab;
            return (
              <li key={tab} className="flex-1">
                <button
                  type="button"
                  onClick={() => onTabChange(tab)}
                  aria-current={active ? "page" : undefined}
                  className={`flex w-full flex-col items-center gap-1 px-2 py-3 text-[11px] font-medium transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.2 : 1.6} />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
