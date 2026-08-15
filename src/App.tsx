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

  if (!user) {
    return <LoginPage signIn={signIn} signUp={signUp} />;
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "home" && <HomePage user={user} signOut={signOut} />}
      {activeTab === "plan" && <PlanPage />}
      {activeTab === "assignments" && <AssignmentsPage />}
    </AppShell>
  );
}
