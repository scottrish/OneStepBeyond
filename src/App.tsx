import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { todayISODate } from "./domain/planningDate";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import PlanPage from "./pages/PlanPage";
import type { PlanTab, Step } from "./pages/PlanPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import AssignmentDetailPage from "./pages/AssignmentDetailPage";
import TodayExecutionPage from "./pages/TodayExecutionPage";
import AppShell from "./components/AppShell";
import type { Tab } from "./components/AppShell";

// Tabs whose own page owns nested internal navigation (a `view` state)
// that can land on something other than that tab's landing screen.
// Re-tapping an already-active tab must still reset that nested state —
// see handleTabChange below. "plan" is included for this same nested-view
// reason (PlanPage's own breakdown sub-view, FR-1) — its day/step are
// deliberately NOT part of what gets reset on re-tap; see planDate/
// planStep below.
type ResettableTab = "home" | "assignments" | "plan";

export default function App() {
  const { user, signUp, signIn, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [tabResetKeys, setTabResetKeys] = useState<Record<ResettableTab, number>>({
    home: 0,
    assignments: 0,
    plan: 0,
  });

  // Plan's selected day and wizard step are lifted up here (rather than
  // PlanPage's own local useState) so they survive PlanPage unmounting
  // when the student switches to another tab and back — see
  // docs/features/iterations/daily-planning/daily-planning.i02.md FR-2
  // and docs/decisions/20260816-plan-tab-state-lifted-not-reset-on-retap.md.
  // Re-tapping Plan while already on it still remounts PlanPage (via
  // tabResetKeys below, same as Home/Assignments) to clear any nested
  // in-progress view, but — deliberately, unlike Home/Assignments —
  // that remount does not reset the day/step held here, since Plan now
  // holds effortful multi-step progress worth preserving even across a
  // re-tap.
  const [planDate, setPlanDate] = useState(() => todayISODate());
  const [planStep, setPlanStep] = useState<Step>("day");
  // Which of Plan's two top-level tabs (the wizard, or week-lookahead.md's
  // "Look ahead" view) is showing — lifted for the same reason as
  // planDate/planStep above: discovered live while testing the Assignment
  // Detail global-overlay change (docs/decisions/
  // 20260817-assignment-detail-global-overlay.md), where opening Detail
  // from Look Ahead and tapping Back landed back on the wizard's Day step
  // instead, because PlanPage's own local view state reset on the remount
  // that round trip causes. Re-tapping the Plan tab still resets this to
  // "wizard" (see handleTabChange) — that's a deliberate return-to-landing
  // gesture, unlike returning from Detail.
  const [planTab, setPlanTab] = useState<PlanTab>("wizard");

  // Today Execution is reached from both Home's "Next" card
  // (home-dashboard.md) and Plan's own entry points (daily-planning.md's
  // Day/Confirm steps) — owned here, one level above both tabs, rather
  // than by either page, so there's a single instance regardless of
  // which one launched it. See docs/decisions/
  // 20260816-today-execution-interim-entry-point.md.
  const [executingToday, setExecutingToday] = useState(false);

  // Assignment Detail is reachable from anywhere an assignment is
  // displayed (Home, Plan, Assignments) — owned here, one level above
  // every tab, exactly like Today Execution above, rather than each tab
  // rendering its own copy. Because opening it never changes `activeTab`,
  // "back" trivially returns to whichever tab was showing; because
  // opening it unmounts that tab's content (same ternary-replace shape as
  // executingToday), returning also remounts it fresh, which refetches
  // automatically — no explicit refetch-on-back plumbing needed anywhere.
  // See docs/decisions/20260817-assignment-detail-global-overlay.md.
  const [openAssignmentId, setOpenAssignmentId] = useState<string | null>(null);

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
    if (tab === "home" || tab === "assignments" || tab === "plan") {
      setTabResetKeys((keys) => ({ ...keys, [tab]: keys[tab] + 1 }));
    }
    if (tab === "plan") setPlanTab("wizard");
    setActiveTab(tab);
    // Today Execution and Assignment Detail both render in place of every
    // tab's own content (see executingToday/openAssignmentId above) —
    // tapping any tab must exit either, the same way it must always
    // return to that tab's own landing view. Without this, the tab
    // underneath silently changes while one of them keeps rendering on
    // top of it, leaving its own back action as the only way out.
    setExecutingToday(false);
    setOpenAssignmentId(null);
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={handleTabChange}>
      {openAssignmentId ? (
        <AssignmentDetailPage
          user={user}
          assignmentId={openAssignmentId}
          onBack={() => setOpenAssignmentId(null)}
          onGoToPlan={() => handleTabChange("plan")}
        />
      ) : executingToday ? (
        <TodayExecutionPage user={user} onBack={() => setExecutingToday(false)} />
      ) : (
        <>
          {activeTab === "home" && (
            <HomePage
              key={tabResetKeys.home}
              user={user}
              signOut={signOut}
              onStartExecution={() => setExecutingToday(true)}
              onGoToPlan={() => handleTabChange("plan")}
              onGoToAssignments={() => handleTabChange("assignments")}
              onOpenAssignment={setOpenAssignmentId}
            />
          )}
          {activeTab === "plan" && (
            <PlanPage
              key={tabResetKeys.plan}
              user={user}
              date={planDate}
              step={planStep}
              onDateChange={setPlanDate}
              onStepChange={setPlanStep}
              tab={planTab}
              onTabChange={setPlanTab}
              onStartExecution={() => setExecutingToday(true)}
              onGoToAssignments={() => handleTabChange("assignments")}
              onOpenAssignment={setOpenAssignmentId}
            />
          )}
          {activeTab === "assignments" && (
            <AssignmentsPage
              key={tabResetKeys.assignments}
              user={user}
              onGoToHome={() => handleTabChange("home")}
              onOpenAssignment={setOpenAssignmentId}
            />
          )}
        </>
      )}
    </AppShell>
  );
}
