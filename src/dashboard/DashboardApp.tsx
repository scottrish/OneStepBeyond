import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "../hooks/useAuth";
import LoginPage from "../pages/LoginPage";
import DashboardShell from "./DashboardShell";
import { useDashboardData } from "./hooks/useDashboardData";
import AssignmentsScreen from "./screens/AssignmentsScreen";
import DiagnosticsScreen from "./screens/DiagnosticsScreen";
import OverviewScreen from "./screens/OverviewScreen";
import ReflectionsScreen from "./screens/ReflectionsScreen";
import TimelineScreen from "./screens/TimelineScreen";
import type { DashboardMode, DashboardScreen } from "./types";

const MODE_STORAGE_KEY = "osb-dashboard-mode";

function readStoredMode(): DashboardMode {
  // localStorage access can throw (disabled storage, private browsing,
  // some test environments) — mode persistence is a convenience, not a
  // requirement, so fall back to the default rather than crash.
  try {
    const saved = window.localStorage.getItem(MODE_STORAGE_KEY);
    return saved === "coach" || saved === "parent" || saved === "diagnostic" ? saved : "coach";
  } catch {
    return "coach";
  }
}

// docs/features/coach-parent-dashboard-feature-spec-v0.1.md — reached at
// its own URL (see main.tsx), reusing the student's own login rather
// than a real Coach/Parent identity. See the spec's Implementation Note
// and docs/decisions/20260816-dashboard-reuses-student-auth.md.
export default function DashboardApp() {
  const { user, signUp, signIn, signOut } = useAuth();
  const [mode, setMode] = useState<DashboardMode>(readStoredMode);
  const [screen, setScreen] = useState<DashboardScreen>("overview");

  useEffect(() => {
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {
      // Ignore — see readStoredMode's comment.
    }
  }, [mode]);

  if (!user) {
    return <LoginPage signIn={signIn} signUp={signUp} />;
  }

  function handleModeChange(nextMode: DashboardMode) {
    // Timeline/Diagnostics aren't in every mode's nav — switching modes
    // resets to Overview rather than leaving the screen state pointed at
    // a now-hidden (or, for Diagnostics, unguarded) screen.
    setMode(nextMode);
    setScreen("overview");
  }

  return (
    <DashboardContent
      user={user}
      signOut={signOut}
      mode={mode}
      onModeChange={handleModeChange}
      screen={screen}
      onScreenChange={setScreen}
    />
  );
}

function DashboardContent({
  user,
  signOut,
  mode,
  onModeChange,
  screen,
  onScreenChange,
}: {
  user: User;
  signOut: () => Promise<void>;
  mode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  screen: DashboardScreen;
  onScreenChange: (screen: DashboardScreen) => void;
}) {
  const { loading, loadError, ...data } = useDashboardData(user.id);

  return (
    <DashboardShell
      studentEmail={user.email}
      signOut={signOut}
      mode={mode}
      onModeChange={onModeChange}
      screen={screen}
      onScreenChange={onScreenChange}
    >
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {loadError && (
        <p role="alert" className="rounded-lg border border-destructive bg-card p-3 text-sm text-card-foreground">
          Couldn&rsquo;t load dashboard data.
        </p>
      )}

      {!loading && !loadError && (
        <>
          {screen === "overview" && <OverviewScreen mode={mode} data={data} onNavigate={onScreenChange} />}
          {screen === "assignments" && <AssignmentsScreen mode={mode} data={data} />}
          {screen === "reflections" && <ReflectionsScreen mode={mode} data={data} />}
          {screen === "timeline" && <TimelineScreen mode={mode} data={data} />}
          {screen === "diagnostics" && mode === "diagnostic" && <DiagnosticsScreen data={data} />}
        </>
      )}
    </DashboardShell>
  );
}
