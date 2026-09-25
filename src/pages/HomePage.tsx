import { useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import { MoreHorizontal, Plus, Settings2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "../components/ErrorBanner";
import { longPlanDate, todayISODate } from "../domain/planningDate";
import { assignmentsNeedingAttention } from "../domain/riskDetection";
import { sortByStartTime } from "../domain/sessionOrder";
import { activitiesOn } from "../domain/studyCapacity";
import { useActivities } from "../hooks/useActivities";
import { useAllWorkSessions } from "../hooks/useAllWorkSessions";
import { useAssignmentsList } from "../hooks/useAssignmentsList";
import { useCourses } from "../hooks/useCourses";
import { useDailyPlanning } from "../hooks/useDailyPlanning";
import { usePreferences } from "../hooks/usePreferences";
import * as workSessionService from "../services/workSessionService";
import ComingUpList from "./home/ComingUpList";
import NeedsAttentionCard from "./home/NeedsAttentionCard";
import NextCard from "./home/NextCard";
import TodaysActivitiesList from "./home/TodaysActivitiesList";

type HomePageProps = {
  user: User;
  // Today Execution is owned by App.tsx, shared with Plan's own entry
  // points — see docs/decisions/20260816-today-execution-interim-entry-point.md.
  onStartExecution: () => void;
  onGoToPlan: () => void;
  // Needs Attention's "Find time" / "Make a plan": Plan's Select for today,
  // with that assignment's work already chosen (daily-planning-and-
  // completion-v2-proposal.md item 1). "Break it down" opens Assignment
  // Detail instead (docs/decisions/20260925-plan-rows-and-one-piece.md).
  onPlanWork: (assignmentId: string) => void;
  onGoToAssignments: () => void;
  // Assignment Detail is likewise a global overlay owned by App.tsx — see
  // docs/decisions/20260817-assignment-detail-global-overlay.md.
  onOpenAssignment: (assignmentId: string) => void;
  // Capture, Settings, and Support (and Settings' own sub-screens) are
  // App-level overlays, reachable from any tab — see
  // docs/decisions/20260924-secondary-screens-app-level-overlays.md.
  onOpenCapture: () => void;
  onOpenSettings: () => void;
  onOpenSupport: () => void;
  // The "add your courses first" state's one action
  // (course-management-v2-proposal.md §3).
  onOpenCourses: () => void;
};

// No name field exists anywhere in this app's signup/profile data (only
// email) — Domain-Model.md's Student "Profile" is explicitly future work
// (see home-dashboard.md's own Explicitly Out of Scope). Deriving a
// display name from the email's local part is a small, reversible stand-
// in for the spec's "Hi {first name}." greeting, not a real name field.
function displayNameFromEmail(email: string | undefined): string {
  const localPart = (email ?? "").split("@")[0] ?? "";
  if (localPart === "") return "there";
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

export default function HomePage({
  user,
  onStartExecution,
  onGoToPlan,
  onPlanWork,
  onGoToAssignments,
  onOpenAssignment,
  onOpenCapture,
  onOpenSettings,
  onOpenSupport,
  onOpenCourses,
}: HomePageProps) {
  const studentId = user.id;
  const today = useMemo(() => todayISODate(), []);
  // The time of day Home was opened, for the Next card's "You had planned
  // to start this earlier" check — read once per visit, like `today`.
  const nowMinutes = useMemo(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);

  const {
    activities,
    loading: activitiesLoading,
    loadError: activitiesLoadError,
    retry: retryActivities,
  } = useActivities(studentId);
  const {
    assignments,
    workItems,
    loading: assignmentsLoading,
    loadError: assignmentsLoadError,
    retry: retryAssignments,
  } = useAssignmentsList(studentId);
  const {
    courses,
    loading: coursesLoading,
    loadError: coursesLoadError,
    retry: retryCourses,
  } = useCourses(studentId);
  // Today's plan is the screen's own critical data (the Next card is
  // "the whole point of the screen"), so this uses the same hook Plan's
  // Day step does — full loading/error surface.
  const {
    workSessions: todaySessions,
    loading: todaySessionsLoading,
    loadError: todaySessionsLoadError,
    retry: retryTodaySessions,
  } = useDailyPlanning(studentId, today);
  // Risk Detection's capacity/scheduling checks span every date through
  // each assignment's own due date, not just today — the one thing this
  // screen needs beyond what Daily Planning's own hooks already fetch.
  const { sessions: allSessions, loading: allSessionsLoading } = useAllWorkSessions(studentId);
  const { preferences, loading: preferencesLoading } = usePreferences(studentId);

  function courseName(courseId: string): string {
    return courses.find((course) => course.id === courseId)?.name ?? "Course";
  }

  // Every one of these feeds visible primary content on this screen
  // (course names in the Next card, which assignment Needs Attention
  // picks, and now the capacity math Needs Attention's rules run on) —
  // unlike PlanPage's own looser gating (where a not-yet-loaded course
  // name is minor secondary text), all of them must be included here or
  // the affected content flashes once between an incomplete and a final
  // answer, violating home-dashboard.md's own "no flash of empty/wrong
  // state" requirement.
  const loading =
    activitiesLoading ||
    assignmentsLoading ||
    todaySessionsLoading ||
    coursesLoading ||
    allSessionsLoading ||
    preferencesLoading;
  // Courses count too: a failed course load must show the error, never
  // the "add your courses first" state (course-management-v2-proposal.md §3).
  const loadError =
    activitiesLoadError ?? assignmentsLoadError ?? todaySessionsLoadError ?? coursesLoadError;
  // A student with no courses yet sees one onboarding state instead of
  // the dashboard: every assignment needs a course, so that's step one.
  const needsCourses = !loading && !loadError && courses.length === 0;

  function retry() {
    retryActivities();
    retryAssignments();
    retryTodaySessions();
    retryCourses();
  }

  const activeTodaySessions = useMemo(
    () => sortByStartTime(todaySessions.filter((session) => session.status !== "done")),
    [todaySessions],
  );
  const next = activeTodaySessions[0];
  const totalPlannedMinutes = todaySessions.reduce((sum, s) => sum + s.plannedMinutes, 0);
  // activitiesOn returns activities in creation order, not time order —
  // sorted here so both this list's own display and the plan-summary
  // lookup below see today's activities chronologically.
  const todaysActivities = [...activitiesOn(activities, today)].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );
  // The plan summary's "before {activity}" context is only accurate when
  // every one of today's active sessions is actually scheduled before
  // that activity starts — previously this just grabbed the day's first
  // activity unconditionally, which could name an activity the plan was
  // actually scheduled *after*. `activeTodaySessions` is sorted by start
  // time (sortByStartTime), so checking the last one covers all of them;
  // a session with no start time makes the ordering unknowable, so the
  // context is omitted rather than guessed.
  const lastSessionStartTime = activeTodaySessions[activeTodaySessions.length - 1]?.startTime;
  const planSummaryActivity = todaysActivities.find(
    (activity) => lastSessionStartTime != null && lastSessionStartTime < activity.startTime,
  );

  const attentionItems = useMemo(
    () =>
      assignmentsNeedingAttention(
        assignments,
        workItems,
        allSessions,
        activities,
        today,
        preferences,
      ),
    [assignments, workItems, allSessions, activities, today, preferences],
  );
  // No longer excludes the Needs Attention item(s) — home-dashboard.md
  // originally required that when Needs Attention showed at most one
  // item. Once item 1b (home-dashboard-followthrough.md) allowed multiple
  // qualifying assignments in Needs Attention, only the primary (index 0)
  // stayed excluded here, since this filter was never updated to match —
  // secondary Needs Attention rows already appeared in Coming Up too. That
  // left the primary item as the only assignment ever hidden from Coming
  // Up, which reads as a bug (an assignment "disappearing" from the list
  // it would otherwise sort into) rather than intentional consistency. See
  // docs/decisions/20260817-coming-up-shows-attention-items.md.
  const comingUp = useMemo(
    () =>
      assignments
        .filter((assignment) => assignment.completedAt === null)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 3),
    [assignments],
  );

  // Starts the session before navigating, rather than just navigating to
  // a screen that also demands a "Start" tap for the identical task —
  // docs/features/home-dashboard-followthrough.md item 5. Only transitions
  // when still "planned" — a session already "in_progress" (the student
  // started it, then came back to Home without finishing) is left alone;
  // the button itself reflects this below rather than always reading
  // "Start" regardless of what's actually true. Fire-and-forget: if the
  // update fails, Today Execution still shows its own "Start" for this
  // task, a safe fallback rather than a dead end here.
  function handleStart() {
    if (next && next.status === "planned") {
      workSessionService.updateWorkSessionStatus(next.id, "in_progress");
    }
    onStartExecution();
  }

  return (
    <div>
      {/* docs/features/mobile-app-shell-and-touch-ergonomics-v0.1.md §2. A
          minmax(0,1fr) grid so a long greeting truncates rather than pushing
          the buttons off-screen. The + is hidden below sm: because the tab
          bar's quick-add replaces it there. Settings and Support live
          behind one overflow menu; Sign out deliberately stays in Settings
          only, so a stray tap on Home can't sign a student out. */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {needsCourses ? "Getting started" : longPlanDate(today)}
          </p>
          <h1 className="truncate text-[clamp(1.65rem,7vw,2.1rem)] leading-tight">
            {needsCourses ? "Welcome," : "Hi"} {displayNameFromEmail(user.email)}.
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <Button
            aria-label="Add assignment"
            variant="ghost"
            size="icon"
            className="hidden rounded-full sm:inline-flex"
            onClick={onOpenCapture}
          >
            <Plus className="size-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="More options" variant="ghost" size="icon" className="rounded-full">
                <MoreHorizontal className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-xl p-1">
              <DropdownMenuItem className="min-h-11 rounded-lg" onSelect={onOpenSupport}>
                <Users className="size-4" /> People who support you
              </DropdownMenuItem>
              <DropdownMenuItem className="min-h-11 rounded-lg" onSelect={onOpenSettings}>
                <Settings2 className="size-4" /> Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {loadError && <ErrorBanner message="Couldn’t load your day." onRetry={retry} className="mt-4" />}

      {needsCourses && (
        <div className="mt-6">
          <EmptyState
            title="First, add your courses."
            hint="Every assignment belongs to a class, so start by adding the classes you take this term."
            action={
              <Button size="lg" className="rounded-2xl" onClick={onOpenCourses}>
                Add your courses
              </Button>
            }
          />
        </div>
      )}

      {!loading && !loadError && !needsCourses && (
        <>
          <NextCard
            next={next}
            todaySessions={todaySessions}
            activeTodaySessions={activeTodaySessions}
            totalPlannedMinutes={totalPlannedMinutes}
            planSummaryActivity={planSummaryActivity}
            workItems={workItems}
            assignments={assignments}
            courseName={courseName}
            nowMinutes={nowMinutes}
            onStart={handleStart}
            onOpenAssignment={onOpenAssignment}
            onGoToPlan={onGoToPlan}
          />

          <NeedsAttentionCard
            attentionItems={attentionItems}
            onOpenAssignment={onOpenAssignment}
            onGoToPlan={onPlanWork}
          />

          <TodaysActivitiesList todaysActivities={todaysActivities} />

          <ComingUpList
            comingUp={comingUp}
            today={today}
            courses={courses}
            courseName={courseName}
            onOpenAssignment={onOpenAssignment}
            onGoToAssignments={onGoToAssignments}
            onAddAssignment={onOpenCapture}
          />
        </>
      )}
    </div>
  );
}
