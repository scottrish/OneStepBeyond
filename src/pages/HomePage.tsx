import { useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import { courseColorValue } from "../domain/courseColor";
import { effortLabel } from "../domain/effortPresets";
import { dueRelativeLabel, longPlanDate, todayISODate } from "../domain/planningDate";
import { assignmentsNeedingAttention } from "../domain/riskDetection";
import type { AttentionItem } from "../domain/riskDetection";
import { sortByStartTime } from "../domain/sessionOrder";
import { activitiesOn } from "../domain/studyCapacity";
import { useActivities } from "../hooks/useActivities";
import { useAllWorkSessions } from "../hooks/useAllWorkSessions";
import { useAssignmentsList } from "../hooks/useAssignmentsList";
import { useCourses } from "../hooks/useCourses";
import { useDailyPlanning } from "../hooks/useDailyPlanning";
import { usePreferences } from "../hooks/usePreferences";
import ActivitiesPage from "./ActivitiesPage";
import AssignmentCapturePage from "./AssignmentCapturePage";
import AssignmentDetailPage from "./AssignmentDetailPage";
import CoursesPage from "./CoursesPage";
import PreferencesPage from "./PreferencesPage";
import SettingsPage from "./SettingsPage";

type HomePageProps = {
  user: User;
  signOut: () => Promise<void>;
  // Today Execution is owned by App.tsx, shared with Plan's own entry
  // points — see docs/decisions/20260816-today-execution-interim-entry-point.md.
  onStartExecution: () => void;
  onGoToPlan: () => void;
  onGoToAssignments: () => void;
};

type View =
  | { name: "home" }
  | { name: "settings" }
  | { name: "activities" }
  | { name: "courses" }
  | { name: "preferences" }
  | { name: "capture-assignment" }
  | { name: "assignment-detail"; assignmentId: string };

const errorBoxStyle =
  "mb-4 rounded-lg border border-destructive bg-card p-3 text-sm text-card-foreground";

// Same local 12-hour formatter PlanPage.tsx/ActivitiesPage.tsx already
// use for Activity/session times — presentation-only, kept local for the
// same reason those files keep their own copy rather than sharing one.
function timeLabel(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const twelveHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelveHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

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

const ATTENTION_ACTION_LABEL: Record<AttentionItem["action"], string> = {
  "break-it-down": "Break it down",
  "find-time": "Find time",
  "make-a-plan": "Make a plan",
};

export default function HomePage({
  user,
  signOut,
  onStartExecution,
  onGoToPlan,
  onGoToAssignments,
}: HomePageProps) {
  const [view, setView] = useState<View>({ name: "home" });
  const studentId = user.id;
  const today = useMemo(() => todayISODate(), []);

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
  const { courses, loading: coursesLoading } = useCourses(studentId);
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
  const loadError = activitiesLoadError ?? assignmentsLoadError ?? todaySessionsLoadError;

  function retry() {
    retryActivities();
    retryAssignments();
    retryTodaySessions();
  }

  const activeTodaySessions = useMemo(
    () => sortByStartTime(todaySessions.filter((session) => session.status !== "done")),
    [todaySessions],
  );
  const next = activeTodaySessions[0];
  const totalPlannedMinutes = todaySessions.reduce((sum, s) => sum + s.plannedMinutes, 0);
  const todaysActivities = activitiesOn(activities, today);

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
  // "At most one item, the most urgent" (home-dashboard.md) —
  // assignmentsNeedingAttention already sorts soonest-due-first.
  const needsAttention = attentionItems[0];

  const comingUp = useMemo(
    () =>
      assignments
        .filter((assignment) => assignment.completedAt === null)
        .filter((assignment) => assignment.id !== needsAttention?.assignment.id)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 3),
    [assignments, needsAttention],
  );

  function handleAttentionAction(item: AttentionItem) {
    if (item.action === "break-it-down") {
      setView({ name: "assignment-detail", assignmentId: item.assignment.id });
    } else {
      onGoToPlan();
    }
  }

  if (view.name === "settings") {
    return (
      <SettingsPage
        onBack={() => setView({ name: "home" })}
        onGoToActivities={() => setView({ name: "activities" })}
        onGoToCourses={() => setView({ name: "courses" })}
        onGoToPreferences={() => setView({ name: "preferences" })}
        signOut={signOut}
      />
    );
  }

  if (view.name === "activities") {
    return (
      <ActivitiesPage user={user} onBack={() => setView({ name: "home" })} />
    );
  }

  if (view.name === "courses") {
    return (
      <CoursesPage user={user} onBack={() => setView({ name: "home" })} />
    );
  }

  if (view.name === "preferences") {
    return (
      <PreferencesPage user={user} onBack={() => setView({ name: "home" })} />
    );
  }

  if (view.name === "capture-assignment") {
    return (
      <AssignmentCapturePage
        user={user}
        onCancel={() => setView({ name: "home" })}
        onGoToCourses={() => setView({ name: "courses" })}
        onSaved={(assignmentId) =>
          setView({ name: "assignment-detail", assignmentId })
        }
      />
    );
  }

  if (view.name === "assignment-detail") {
    return (
      <AssignmentDetailPage
        user={user}
        assignmentId={view.assignmentId}
        onBack={() => setView({ name: "home" })}
      />
    );
  }

  return (
    <main className="p-8">
      <header className="flex items-center justify-between gap-1">
        <div>
          <p className="text-sm text-muted-foreground">{longPlanDate(today)}</p>
          <h1 className="text-3xl">Hi {displayNameFromEmail(user.email)}.</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button
            aria-label="New assignment"
            variant="ghost"
            size="icon"
            onClick={() => setView({ name: "capture-assignment" })}
          >
            <Plus className="size-5" />
          </Button>
          <Button
            aria-label="Settings"
            variant="ghost"
            size="icon"
            onClick={() => setView({ name: "settings" })}
          >
            <Settings2 className="size-5" />
          </Button>
        </div>
      </header>

      {loadError && (
        <div role="alert" className={`${errorBoxStyle} mt-4`}>
          <p className="mb-2">Couldn&rsquo;t load your day.</p>
          <Button onClick={retry}>Try again</Button>
        </div>
      )}

      {!loading && !loadError && (
        <>
          {next ? (
            <div className="mt-6 rounded-3xl bg-primary p-6 text-primary-foreground">
              <p className="text-sm opacity-80">Next</p>
              <p className="mt-1 text-xl font-medium">
                {workItems.find((w) => w.id === next.workItemId)?.title ?? "Study session"}
              </p>
              {(() => {
                const item = workItems.find((w) => w.id === next.workItemId);
                const assignment = item
                  ? assignments.find((a) => a.id === item.assignmentId)
                  : undefined;
                return (
                  assignment && (
                    <p className="mt-1 text-sm opacity-80">
                      {assignment.title} · {courseName(assignment.courseId)}
                    </p>
                  )
                );
              })()}
              <p className="mt-1 text-sm opacity-80">{effortLabel(next.plannedMinutes)}</p>
              <Button
                size="lg"
                variant="secondary"
                className="mt-4 w-full rounded-2xl"
                onClick={onStartExecution}
              >
                Start
              </Button>
            </div>
          ) : todaySessions.length > 0 ? (
            // Every session for today is done — today-execution.md's own
            // calm confirmation, reused here rather than falling through
            // to the "no plan yet" empty state, which would wrongly imply
            // nothing was ever planned.
            <div className="mt-6 rounded-3xl bg-primary p-6 text-primary-foreground">
              <p className="text-xl font-medium">That&rsquo;s everything for today.</p>
              <p className="mt-1 text-sm opacity-80">
                You did what you said you would. The evening is yours.
              </p>
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState
                title="No plan for today yet."
                hint="Planning takes about five minutes and makes the rest of the day easier."
                action={<Button onClick={onGoToPlan}>Plan today</Button>}
              />
            </div>
          )}

          {next && (
            <p className="mt-3 text-sm text-muted-foreground">
              Today&rsquo;s plan: about {effortLabel(totalPlannedMinutes)} · {todaySessions.length}{" "}
              {todaySessions.length === 1 ? "task" : "tasks"}
              {todaysActivities[0] && <> · before {todaysActivities[0].name}</>} ·{" "}
              <button type="button" onClick={onGoToPlan} className="text-primary underline underline-offset-4">
                View plan
              </button>
            </p>
          )}

          {needsAttention && (
            <div className="mt-4 rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-1 text-sm font-semibold text-foreground">Needs attention</h2>
              <p className="text-sm text-foreground">
                {needsAttention.assignment.title}: {needsAttention.message}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 rounded-2xl"
                onClick={() => handleAttentionAction(needsAttention)}
              >
                {ATTENTION_ACTION_LABEL[needsAttention.action]}
              </Button>
            </div>
          )}

          {todaysActivities.length > 0 && (
            <div className="mt-4">
              <h2 className="mb-2 text-sm font-semibold text-foreground">Today&rsquo;s activities</h2>
              <ul className="flex flex-col gap-1">
                {todaysActivities.map((activity) => (
                  <li
                    key={activity.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2 text-sm"
                  >
                    <span className="text-foreground">{activity.name}</span>
                    <span className="ml-auto text-muted-foreground">
                      {timeLabel(activity.startTime)}–{timeLabel(activity.finishTime)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4">
            <h2 className="mb-2 text-sm font-semibold text-foreground">Coming up</h2>
            {comingUp.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {comingUp.map((assignment) => (
                  <li key={assignment.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setView({ name: "assignment-detail", assignmentId: assignment.id })
                      }
                      className="flex min-h-11 w-full items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-left text-sm"
                    >
                      <span
                        aria-hidden="true"
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ background: courseColorValue(courses.find((c) => c.id === assignment.courseId)?.colorIndex ?? 0) }}
                      />
                      <span className="min-w-0 flex-1 truncate text-foreground">
                        {assignment.title}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {dueRelativeLabel(assignment.dueDate, today)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Nothing coming up."
                hint="Capture an assignment to see it here."
                action={
                  <Button onClick={() => setView({ name: "capture-assignment" })}>
                    Add an assignment
                  </Button>
                }
              />
            )}
            {comingUp.length > 0 && (
              <button
                type="button"
                onClick={onGoToAssignments}
                className="mt-2 text-sm text-primary underline underline-offset-4"
              >
                See all assignments
              </button>
            )}
          </div>
        </>
      )}
    </main>
  );
}
