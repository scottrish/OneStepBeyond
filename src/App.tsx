import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import PlanPage from "./pages/PlanPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import AppShell from "./components/AppShell";
import type { Tab } from "./components/AppShell";

export default function App() {
  const { user, signUp, signIn, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [homeResetKey, setHomeResetKey] = useState(0);

  if (!user) {
    return <LoginPage signIn={signIn} signUp={signUp} />;
  }

  function handleTabChange(tab: Tab) {
    // Tapping "Home" must always return to Home's own landing view, even
    // when the tab bar was already showing "home" as active — otherwise
    // HomePage's internal navigation (e.g. a nested Assignment Detail
    // screen) has no signal that the tab was tapped again, since setting
    // activeTab to its current value is a no-op. Remounting HomePage via
    // this key resets its internal state unconditionally.
    if (tab === "home") setHomeResetKey((key) => key + 1);
    setActiveTab(tab);
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={handleTabChange}>
      {activeTab === "home" && (
        <HomePage key={homeResetKey} user={user} signOut={signOut} />
      )}
      {activeTab === "plan" && <PlanPage />}
      {activeTab === "assignments" && (
        <AssignmentsPage user={user} onGoToHome={() => handleTabChange("home")} />
      )}
    </AppShell>
  );
}
