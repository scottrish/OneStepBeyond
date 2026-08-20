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

// docs/features/supporter-role-based-access-feature-spec-v0.1.md — mode
// is now derived from a real Active Support Relationship's role, or from
// superuser status for Diagnostic Mode (§7.2/§7.3), never chosen by the
// viewer. This is a read-only label, not a control — there is
// deliberately no equivalent of the old MODES toggle here anymore.
const MODE_LABEL: Record<DashboardMode, string> = {
  coach: "Coach",
  parent: "Parent",
  diagnostic: "Diagnostic",
};

type DashboardShellProps = {
  studentLabel: string;
  signOut: () => Promise<void>;
  mode: DashboardMode;
  // Present only when the viewer has more than one Student they could be
  // looking at (multiple Active relationships, or superuser with more
  // than one known student) — omitted entirely otherwise, matching
  // supporter-invitation-feature-spec-v0.1.md §28's "no need to optimize
  // this in the first implementation, but do not prevent it
  // architecturally."
  onSwitchStudent?: () => void;
  screen: DashboardScreen;
  onScreenChange: (screen: DashboardScreen) => void;
  children: ReactNode;
};

export default function DashboardShell({
  studentLabel,
  signOut,
  mode,
  onSwitchStudent,
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
            <p className="hidden text-sm text-muted-foreground sm:block">{studentLabel}</p>
            <span className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
              {MODE_LABEL[mode]}
            </span>
            {onSwitchStudent && (
              <button
                type="button"
                onClick={onSwitchStudent}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Switch student
              </button>
            )}
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
