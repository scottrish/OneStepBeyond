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
import * as workSessionService from "../services/workSessionService";
import ActivitiesPage from "./ActivitiesPage";
import AssignmentCapturePage from "./AssignmentCapturePage";
import CoursesPage from "./CoursesPage";
import PreferencesPage from "./PreferencesPage";
import SettingsPage from "./SettingsPage";
import SupportPage from "./SupportPage";

type HomePageProps = {
  user: User;
  signOut: () => Promise<void>;
  // Today Execution is owned by App.tsx, shared with Plan's own entry
  // points — see docs/decisions/20260816-today-execution-interim-entry-point.md.
  onStartExecution: () => void;
  onGoToPlan: () => void;
  onGoToAssignments: () => void;
  // Assignment Detail is likewise a global overlay owned by App.tsx — see
  // docs/decisions/20260817-assignment-detail-global-overlay.md.
  onOpenAssignment: (assignmentId: string) => void;
};

type View =
  | { name: "home" }
  | { name: "settings" }
  | { name: "support" }
  | { name: "activities" }
  | { name: "courses" }
  | { name: "preferences" }
  | { name: "capture-assignment" };

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
  onOpenAssignment,
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
  // "At most one item, the most urgent" (home-dashboard.md) —
  // assignmentsNeedingAttention already sorts soonest-due-first.
  const needsAttention = attentionItems[0];

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

  if (view.name === "settings") {
    return (
      <SettingsPage
        onBack={() => setView({ name: "home" })}
        onGoToActivities={() => setView({ name: "activities" })}
        onGoToCourses={() => setView({ name: "courses" })}
        onGoToPreferences={() => setView({ name: "preferences" })}
        onGoToSupport={() => setView({ name: "support" })}
        signOut={signOut}
      />
    );
  }

  if (view.name === "support") {
    return <SupportPage user={user} onBack={() => setView({ name: "settings" })} />;
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
        onSaved={(assignmentId) => onOpenAssignment(assignmentId)}
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
                    <button
                      type="button"
                      onClick={() => onOpenAssignment(assignment.id)}
                      className="mt-1 block text-left text-sm opacity-80 underline-offset-4 hover:underline"
                    >
                      {assignment.title} · {courseName(assignment.courseId)}
                    </button>
                  )
                );
              })()}
              <p className="mt-1 text-sm opacity-80">{effortLabel(next.plannedMinutes)}</p>
              <Button
                size="lg"
                variant="secondary"
                className="mt-4 w-full rounded-2xl"
                onClick={handleStart}
              >
                {next.status === "planned" ? "Start" : "Continue"}
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

          {next && activeTodaySessions.length > 1 && (
            <div className="mt-3">
              <h3 className="mb-2 text-sm font-semibold text-foreground">After that</h3>
              <ul className="flex flex-col gap-1">
                {activeTodaySessions.slice(1).map((session) => {
                  const item = workItems.find((w) => w.id === session.workItemId);
                  return (
                    <li
                      key={session.id}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {item?.title ?? "Study session"}
                      </span>
                      <span className="shrink-0 text-xs">
                        {effortLabel(session.plannedMinutes)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {next && (
            <p className="mt-3 text-sm text-muted-foreground">
              Today&rsquo;s plan: about {effortLabel(totalPlannedMinutes)} · {todaySessions.length}{" "}
              {todaySessions.length === 1 ? "task" : "tasks"}
              {planSummaryActivity && <> · before {planSummaryActivity.name}</>} ·{" "}
              <button type="button" onClick={onGoToPlan} className="text-primary underline underline-offset-4">
                View plan
              </button>
            </p>
          )}

          {needsAttention && (
            <div className="mt-4 rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-1 text-sm font-semibold text-foreground">Needs attention</h2>
              <p className="text-sm text-foreground">
                <button
                  type="button"
                  onClick={() => onOpenAssignment(needsAttention.assignment.id)}
                  className="underline-offset-4 hover:underline"
                >
                  {needsAttention.assignment.title}
                </button>
                : {needsAttention.message}
              </p>
              {/* Every action lands on Plan, including "Break it down" —
                  Plan's own Day step already shows every assignment
                  needing a breakdown (this one included) with the full
                  "Break down / Plan as one task instead" choice, so
                  routing there gives the identical experience Plan itself
                  offers instead of a separate, thinner one opened here.
                  See docs/features/home-dashboard-followthrough.md item 2. */}
              <Button
                variant="outline"
                size="sm"
                className="mt-3 rounded-2xl"
                onClick={onGoToPlan}
              >
                {ATTENTION_ACTION_LABEL[needsAttention.action]}
              </Button>

              {attentionItems.length > 1 && (
                <ul className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                  {attentionItems.slice(1).map((item) => (
                    <li key={item.assignment.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenAssignment(item.assignment.id)}
                        className="min-w-0 flex-1 truncate text-left text-sm text-foreground underline-offset-4 hover:underline"
                      >
                        {item.assignment.title}
                      </button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 rounded-2xl"
                        onClick={onGoToPlan}
                      >
                        {ATTENTION_ACTION_LABEL[item.action]}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
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
                      onClick={() => onOpenAssignment(assignment.id)}
                      className="flex min-h-11 w-full items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-left text-sm"
                    >
                      <span
                        aria-hidden="true"
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ background: courseColorValue(courses.find((c) => c.id === assignment.courseId)?.colorIndex ?? 0) }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-foreground">{assignment.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {courseName(assignment.courseId)}
                        </span>
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
