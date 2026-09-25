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
import AssignmentCapturePage from "./pages/AssignmentCapturePage";
import SettingsPage from "./pages/SettingsPage";
import CoursesPage from "./pages/CoursesPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import PreferencesPage from "./pages/PreferencesPage";
import SupportPage from "./pages/SupportPage";
import AppShell from "./components/AppShell";
import SwipeRowProvider from "./components/SwipeRowProvider";
import type { Tab } from "./components/AppShell";

// Tabs whose own page owns nested internal navigation (a `view` state)
// that can land on something other than that tab's landing screen.
// Re-tapping an already-active tab must still reset that nested state —
// see handleTabChange below. "plan" is included for this same nested-view
// reason (PlanPage's own breakdown sub-view, FR-1) — its day/step are
// deliberately NOT part of what gets reset on re-tap; see planDate/
// planStep below.
type ResettableTab = "home" | "assignments" | "plan";

// Screens that used to be HomePage sub-views and are now reachable from
// any tab (the tab bar's quick-add/Settings slot, Home's "More options",
// Assignments' "Add assignment") — see
// docs/decisions/20260924-secondary-screens-app-level-overlays.md.
type SecondaryScreen = "capture" | "settings" | "courses" | "activities" | "preferences" | "support";

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
  // "day" = the chosen day's landing view: its existing plan if it has one,
  // otherwise Select (docs/decisions/20260925-existing-day-view.md).
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

  // Capture, Settings, and Settings' own sub-screens — the same
  // render-in-place-of-the-tab pattern as openAssignmentId/executingToday
  // above. Opening one never changes activeTab, so closing it returns to
  // whichever tab was showing (e.g. quick-add from Plan, then Cancel, is
  // back on Plan with its lifted day/step intact). See
  // docs/decisions/20260924-secondary-screens-app-level-overlays.md.
  const [secondary, setSecondary] = useState<SecondaryScreen | null>(null);
  // Courses is reachable from two places: Settings, and capture's "Add a
  // course" (a student with no courses yet). Its Back returns to whichever
  // opened it — returning to Settings from the capture path would strand
  // the student away from the assignment they were adding.
  const [coursesOpenedFrom, setCoursesOpenedFrom] = useState<"settings" | "capture">("settings");

  if (!user) {
    return <LoginPage signIn={signIn} signUp={signUp} />;
  }

  // Assignment Detail's "Plan work for today" (docs/features/
  // assignment-detail-cta-hierarchy.md item 1) always means *today*,
  // specifically — unlike Home's own onGoToPlan callers (which land on
  // whatever day/step Plan was last left on), this one snaps the date
  // back to today and the step back to Select (PlanPage's own landing
  // step — see docs/decisions/20260818-plan-day-step-removed.md), in
  // case Plan was last left mid-wizard for some other assignment's
  // selections or showing a different day. Does not pass the originating
  // assignment through or pre-select its Work Items — that remains
  // home-dashboard-followthrough.md item 4's separate, larger, still-
  // deferred scope (chosen/showAll timing against useAssignmentsList's
  // async load).
  function handleGoToPlanToday() {
    setPlanDate(todayISODate());
    setPlanStep("select");
    handleTabChange("plan");
  }

  // Home's Needs Attention actions ("Find time", "Make a plan") mean "add
  // work", so they skip the day view and open Select on whatever day Plan
  // is showing (docs/decisions/20260925-existing-day-view.md point 3).
  function handleGoToPlanToAddWork() {
    setPlanStep("select");
    handleTabChange("plan");
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
    setSecondary(null);
  }

  function renderSecondary(screen: SecondaryScreen, signedInUser: NonNullable<typeof user>) {
    const close = () => setSecondary(null);
    switch (screen) {
      case "capture":
        return (
          <AssignmentCapturePage
            user={signedInUser}
            onCancel={close}
            onGoToCourses={() => {
              setCoursesOpenedFrom("capture");
              setSecondary("courses");
            }}
            onSaved={(assignmentId) => {
              setSecondary(null);
              setOpenAssignmentId(assignmentId);
            }}
          />
        );
      case "settings":
        return (
          <SettingsPage
            onBack={close}
            onGoToActivities={() => setSecondary("activities")}
            onGoToCourses={() => {
              setCoursesOpenedFrom("settings");
              setSecondary("courses");
            }}
            onGoToPreferences={() => setSecondary("preferences")}
            onGoToSupport={() => setSecondary("support")}
            signOut={signOut}
          />
        );
      // Settings' own destinations return to Settings. Courses returns to
      // whichever screen opened it (see coursesOpenedFrom above).
      case "support":
        return <SupportPage user={signedInUser} onBack={() => setSecondary("settings")} />;
      case "courses":
        return <CoursesPage user={signedInUser} onBack={() => setSecondary(coursesOpenedFrom)} />;
      case "activities":
        return <ActivitiesPage user={signedInUser} onBack={() => setSecondary("settings")} />;
      case "preferences":
        return <PreferencesPage user={signedInUser} onBack={() => setSecondary("settings")} />;
    }
  }

  return (
    // One swipe-open row at a time across every tab and overlay —
    // docs/features/mobile-gestures-reorder-and-swipe-v0.1.md §2.
    <SwipeRowProvider>
      <AppShell
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onQuickAdd={() => setSecondary("capture")}
        onOpenSettings={() => setSecondary("settings")}
      >
        {openAssignmentId ? (
          <AssignmentDetailPage
            user={user}
            assignmentId={openAssignmentId}
            onBack={() => setOpenAssignmentId(null)}
            onGoToPlan={handleGoToPlanToday}
          />
        ) : executingToday ? (
          <TodayExecutionPage user={user} onBack={() => setExecutingToday(false)} />
        ) : secondary ? (
          renderSecondary(secondary, user)
        ) : (
          <>
            {activeTab === "home" && (
              <HomePage
                key={tabResetKeys.home}
                user={user}
                onStartExecution={() => setExecutingToday(true)}
                onGoToPlan={() => handleTabChange("plan")}
                onPlanWork={handleGoToPlanToAddWork}
                onGoToAssignments={() => handleTabChange("assignments")}
                onOpenAssignment={setOpenAssignmentId}
                onOpenCapture={() => setSecondary("capture")}
                onOpenSettings={() => setSecondary("settings")}
                onOpenSupport={() => setSecondary("support")}
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
                onOpenCapture={() => setSecondary("capture")}
                onOpenAssignment={setOpenAssignmentId}
              />
            )}
          </>
        )}
      </AppShell>
    </SwipeRowProvider>
  );
}
