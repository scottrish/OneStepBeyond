import type { ComponentType, ReactNode } from "react";
import { Activity, ClipboardList, LayoutDashboard, MessageSquareQuote, TerminalSquare } from "lucide-react";
import type { DashboardMode, DashboardScreen } from "./types";

// Adapted from ../OneStepBeyondPrototype/src/routes/dashboard.tsx's
// DashboardChrome, per docs/features/coach-parent-dashboard-feature-spec-v0.1.md's
// Implementation Note. The prototype navigates via TanStack Router
// Link/Outlet; this app has no router (see CLAUDE.md's "add it when a
// feature needs it"), so navigation here is plain lifted state, the same
// pattern this app's own mobile AppShell already uses.

const NAV: {
  screen: DashboardScreen;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  modes: readonly DashboardMode[];
}[] = [
  { screen: "overview", label: "Overview", icon: LayoutDashboard, modes: ["coach", "parent", "diagnostic"] },
  { screen: "assignments", label: "Assignments & Work", icon: ClipboardList, modes: ["coach", "parent", "diagnostic"] },
  { screen: "reflections", label: "Reflections", icon: MessageSquareQuote, modes: ["coach", "parent", "diagnostic"] },
  { screen: "timeline", label: "Evidence Timeline", icon: Activity, modes: ["coach", "diagnostic"] },
  { screen: "diagnostics", label: "Diagnostics", icon: TerminalSquare, modes: ["diagnostic"] },
];

const MODES: { id: DashboardMode; label: string }[] = [
  { id: "coach", label: "Coach" },
  { id: "parent", label: "Parent" },
  { id: "diagnostic", label: "Diagnostic" },
];

type DashboardShellProps = {
  studentEmail: string | undefined;
  signOut: () => Promise<void>;
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  screen: DashboardScreen;
  onScreenChange: (screen: DashboardScreen) => void;
  children: ReactNode;
};

export default function DashboardShell({
  studentEmail,
  signOut,
  mode,
  onModeChange,
  screen,
  onScreenChange,
  children,
}: DashboardShellProps) {
  const visible = NAV.filter((item) => item.modes.includes(mode));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex w-full items-center justify-between gap-6 px-6 py-3">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-base font-semibold text-foreground">One Step Beyond</span>
            <span className="text-xs text-muted-foreground">Coach / Parent Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            {studentEmail ? (
              <p className="hidden text-sm text-muted-foreground sm:block">{studentEmail}</p>
            ) : null}
            <div className="flex rounded-lg border border-border p-0.5">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onModeChange(m.id)}
                  aria-pressed={mode === m.id}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    mode === m.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full gap-8 px-6 py-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1" aria-label="Dashboard">
            {visible.map((item) => {
              const active = item.screen === screen;
              const Icon = item.icon;
              return (
                <button
                  key={item.screen}
                  type="button"
                  onClick={() => onScreenChange(item.screen)}
                  aria-current={active ? "page" : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? "bg-secondary font-medium text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" strokeWidth={1.8} />
                  {item.label}
                </button>
              );
            })}
            {mode === "parent" ? (
              <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                Parent mode hides raw event data, scaffold history, and capability modelling.
              </p>
            ) : null}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex gap-2 overflow-x-auto lg:hidden">
            {visible.map((item) => (
              <button
                key={item.screen}
                type="button"
                onClick={() => onScreenChange(item.screen)}
                aria-current={item.screen === screen ? "page" : undefined}
                className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground"
              >
                {item.label}
              </button>
            ))}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
