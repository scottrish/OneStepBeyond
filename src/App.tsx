import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import PlanPage from "./pages/PlanPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import AppShell from "./components/AppShell";
import type { Tab } from "./components/AppShell";

// Tabs whose own page owns nested internal navigation (a `view` state
// that can land on something other than that tab's landing screen).
// Re-tapping an already-active tab must still reset that nested state —
// see handleTabChange below. "plan" isn't listed: PlanPage has no nested
// views yet, so there's nothing for a reset key to do there.
type ResettableTab = "home" | "assignments";

export default function App() {
  const { user, signUp, signIn, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [tabResetKeys, setTabResetKeys] = useState<Record<ResettableTab, number>>({
    home: 0,
    assignments: 0,
  });

  if (!user) {
    return <LoginPage signIn={signIn} signUp={signUp} />;
  }

  function handleTabChange(tab: Tab) {
    // Tapping a tab must always return to that tab's own landing view,
    // even when the tab bar was already showing it as active —
    // otherwise a page's internal navigation (e.g. a nested Assignment
    // Detail screen) has no signal that its tab was tapped again, since
    // setting activeTab to its current value is a no-op. Remounting the
    // page via this key resets its internal state unconditionally. Was
    // previously special-cased to "home" only, which is exactly why the
    // same dead end resurfaced on the Assignments tab — see
    // docs/playwright/manual-work-breakdown-reflection/iteration-01/findings.yaml
    // FINDING-WB-001.
    if (tab === "home" || tab === "assignments") {
      setTabResetKeys((keys) => ({ ...keys, [tab]: keys[tab] + 1 }));
    }
    setActiveTab(tab);
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={handleTabChange}>
      {activeTab === "home" && (
        <HomePage key={tabResetKeys.home} user={user} signOut={signOut} />
      )}
      {activeTab === "plan" && <PlanPage />}
      {activeTab === "assignments" && (
        <AssignmentsPage
          key={tabResetKeys.assignments}
          user={user}
          onGoToHome={() => handleTabChange("home")}
        />
      )}
    </AppShell>
  );
}
