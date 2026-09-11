import { useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import ErrorBanner from "../components/ErrorBanner";
import { errorMessage } from "../lib/errorMessage";
import {
  addDaysISODate,
  longPlanDate,
  shortDayLabel,
  todayISODate,
} from "../domain/planningDate";
import { rankCandidates } from "../domain/planningCandidates";
import { activitiesOn, availableMinutes, studySlots } from "../domain/studyCapacity";
import type { StudySlot } from "../domain/studyCapacity";
import { useActivities } from "../hooks/useActivities";
import { useAllWorkSessions } from "../hooks/useAllWorkSessions";
import { useAssignmentsList } from "../hooks/useAssignmentsList";
import { useCourses } from "../hooks/useCourses";
import { useDailyPlanning } from "../hooks/useDailyPlanning";
import { useEstimationDrift } from "../hooks/useEstimationDrift";
import { usePreferences } from "../hooks/usePreferences";
import * as workBreakdownService from "../services/workBreakdownService";
import * as workSessionService from "../services/workSessionService";
import type { Assignment } from "../services/assignmentService";
import type { WorkSession } from "../services/workSessionService";
import ConfirmStep from "./plan/ConfirmStep";
import EstimateStep from "./plan/EstimateStep";
import ScheduleStep from "./plan/ScheduleStep";
import SelectStep from "./plan/SelectStep";
import WeekLookAhead from "./WeekLookAhead";
import WorkBreakdownPage from "./WorkBreakdownPage";

// Step and the selected day are lifted into App.tsx and passed down as
// controlled props (date/step + onDateChange/onStepChange) instead of
// local useState, so they survive PlanPage unmounting when the student
// switches to another bottom-nav tab and back — see
// docs/features/iterations/daily-planning/daily-planning.i02.md FR-2.
// Everything else in the wizard (chosen items, times, show-more, the
// just-confirmed acknowledgment) stays local: FR-2's acceptance criteria
// only require the day/step to survive, not in-progress selections.
//
// There used to be a standalone "day" step before "select" — a full
// screen (day-picker context, due-that-day, Activities, Already planned,
// capacity) gated behind its own "Continue" tap. Removed: the day-picker
// itself was already hoisted above this union's steps and visible on
// every one of them, so "day" wasn't where a day got chosen — it was
// only ever a mandatory look-before-you-select screen for whichever date
// was already selected (today, by default, for the dominant case). See
// docs/decisions/20260818-plan-day-step-removed.md. Its content now
// renders as Select's own header, unconditionally, with no gate in front
// of it.
export type Step = "select" | "estimate" | "schedule" | "confirm";
// Which of Plan's two top-level tabs is showing — the wizard, or
// week-lookahead.md's own "Look ahead" view. Controlled/lifted for the
// same reason date/step are (see PlanPageProps.tab below).
export type PlanTab = "wizard" | "lookahead";

type PlanPageProps = {
  user: User;
  date: string;
  step: Step;
  onDateChange: (date: string) => void;
  onStepChange: (step: Step) => void;
  // Lifted to App.tsx alongside date/step so it survives PlanPage
  // unmounting — not just on a tab switch (date/step's original reason)
  // but also across an Assignment Detail round trip, discovered live
  // while testing: opening Detail from Look Ahead and tapping Back landed
  // back on the wizard's default step instead of Look Ahead, since this
  // used to be local state that reset on remount. Re-tapping the Plan tab
  // still resets it to "wizard" (App.tsx's handleTabChange) — a
  // deliberate return-to-landing gesture, unlike returning from Detail.
  tab: PlanTab;
  onTabChange: (tab: PlanTab) => void;
  // Today Execution is reached from here (the Confirm step's success
  // screen) and from Home's own Next card (home-dashboard.md) — lifted up
  // to App.tsx rather than owned by either page, so both entry points
  // share one instance instead of duplicating it. See docs/decisions/
  // 20260816-today-execution-interim-entry-point.md.
  onStartExecution: () => void;
  // Select's true-empty state ("no open assignments at all," distinct
  // from "assignments exist but need breaking down first") routes to
  // the Assignments tab rather than capturing inline, since Plan has no
  // capture UI of its own — same tab-switch shape as Home's own
  // onGoToAssignments.
  onGoToAssignments: () => void;
  // Assignment Detail is a global overlay owned by App.tsx — see
  // docs/decisions/20260817-assignment-detail-global-overlay.md. Wired
  // here for Select's own "Due:" list (part of its day-context header,
  // see docs/decisions/20260818-plan-day-step-removed.md); its candidate
  // cards are deliberately not wired yet (multi-select checkboxes, a
  // different interaction-design question — see that decision record).
  onOpenAssignment: (assignmentId: string) => void;
};

// A nested view within the Plan tab, distinct from both the wizard's own
// `step` and the top-level wizard/lookahead `tab` above. Reached from
// FR-1's breakdown signal (see needsBreakdown below) — reuses
// WorkBreakdownPage exactly as Assignment Detail does, rather than
// inventing a new UI for the same job (CLAUDE.md YAGNI). Deliberately
// stays local (not lifted): unlike the tab choice, a mid-breakdown flow
// resetting on remount is the same accepted tradeoff `chosen`/`times`
// selections already have.
type View = { name: "wizard" } | { name: "breakdown"; assignmentId: string };

const STEP_LABEL: Record<Step, string> = {
  select: "Step 1 of 4",
  estimate: "Step 2 of 4",
  schedule: "Step 3 of 4",
  confirm: "Step 4 of 4",
};

// Today + next 4 days (docs/features/daily-planning.md's day picker strip
// — see the `View` union above for the "Look ahead" tab it also
// mentions, week-lookahead.md's own separate 7-day view).
const DAY_STRIP_LENGTH = 5;


/** Default each chosen item into the first open slot with room, in order. */
function assignDefaultTimes(
  chosenIds: string[],
  chosen: Record<string, number>,
  slots: StudySlot[],
): Record<string, string> {
  const next: Record<string, string> = {};
  let slotIndex = 0;
  let cursor = slots[0]?.start;

  for (const id of chosenIds) {
    const slot = slots[slotIndex];
    next[id] = cursor ?? slot?.start ?? "16:00";
    const minutes = chosen[id] ?? 0;
    if (slot) {
      const [h, m] = (cursor ?? slot.start).split(":").map(Number);
      const end = (h ?? 0) * 60 + (m ?? 0) + minutes;
      const [fh, fm] = slot.finish.split(":").map(Number);
      if (end >= (fh ?? 0) * 60 + (fm ?? 0) && slotIndex < slots.length - 1) {
        slotIndex += 1;
        cursor = slots[slotIndex]?.start;
      } else {
        cursor = `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
      }
    }
  }

  return next;
}

export default function PlanPage({
  user,
  date,
  step,
  onDateChange,
  onStepChange,
  tab,
  onTabChange,
  onStartExecution,
  onGoToAssignments,
  onOpenAssignment,
}: PlanPageProps) {
  const studentId = user.id;
  const today = useMemo(() => todayISODate(), []);

  const [view, setView] = useState<View>({ name: "wizard" });
  const [chosen, setChosen] = useState<Record<string, number>>({});
  const [times, setTimes] = useState<Record<string, string>>({});
  const [showAll, setShowAll] = useState(false);
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [planningAssignmentId, setPlanningAssignmentId] = useState<string | null>(null);
  const [planDirectlyError, setPlanDirectlyError] = useState<string | null>(null);
  const [movingSessionId, setMovingSessionId] = useState<string | null>(null);
  const [moveTargetDate, setMoveTargetDate] = useState<string | null>(null);
  const [moveSubmitting, setMoveSubmitting] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

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
  const { courses } = useCourses(studentId);
  const {
    workSessions,
    loading: sessionsLoading,
    loadError: sessionsLoadError,
    actionError,
    retry: retrySessions,
    confirmPlan,
    removeSession,
  } = useDailyPlanning(studentId, date);
  const drift = useEstimationDrift(studentId);
  const { sessions: allSessions, refetch: refetchAllSessions } = useAllWorkSessions(studentId);
  const { preferences, loading: preferencesLoading } = usePreferences(studentId);

  // preferences directly feeds capacity math below (availableMinutes/
  // studySlots) — a not-yet-loaded default would show a wrong capacity
  // figure that then jumps once the real preferences arrive, the same
  // flash home-dashboard.md's loading gate was written to prevent.
  const loading = activitiesLoading || assignmentsLoading || sessionsLoading || preferencesLoading;
  const loadError = activitiesLoadError ?? assignmentsLoadError ?? sessionsLoadError;

  function retry() {
    retryActivities();
    retryAssignments();
    retrySessions();
  }

  function courseName(courseId: string): string {
    return courses.find((course) => course.id === courseId)?.name ?? "Course";
  }

  const candidates = useMemo(
    () => rankCandidates(assignments, workItems),
    [assignments, workItems],
  );
  const visibleCandidates = showAll ? candidates : candidates.slice(0, 3);

  // Open assignments with zero Work Items — i.e. never broken down —
  // are exactly what makes candidates empty and Select dead-end. Named
  // here so Select's empty state (and BreakdownNotice, in the mixed
  // case) can point at them directly. docs/features/iterations/
  // daily-planning/daily-planning.i02.md FR-1.
  const assignmentsNeedingBreakdown = useMemo(
    () =>
      assignments
        .filter(
          (assignment) =>
            assignment.completedAt === null &&
            !workItems.some((item) => item.assignmentId === assignment.id),
        )
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [assignments, workItems],
  );

  // Work items that already have a planned session on a *different* date
  // — used by Select to tell the student, before they pick it again,
  // that it's already committed elsewhere, rather than leaving that
  // commitment silently invisible. Continuing an item across more than
  // one day is an expected outcome (not finishing Monday, picking it
  // back up Tuesday), not a mistake — see daily-planning.i04.md FR-2 for
  // why this reads as informational rather than a warning.
  // docs/features/iterations/daily-planning/daily-planning.i03.md FR-1.
  // Maps workItemId -> the date it's already planned for.
  const scheduledElsewhere = useMemo(() => {
    const map = new Map<string, string>();
    for (const session of allSessions) {
      if (session.status === "planned" && session.date !== date) {
        map.set(session.workItemId, session.date);
      }
    }
    return map;
  }, [allSessions, date]);

  const capacity = availableMinutes(activities, workSessions, date, preferences);
  const commitments = activitiesOn(activities, date);
  const dueThatDay = assignments.filter(
    (assignment) => !assignment.completedAt && assignment.dueDate === date,
  );
  const slots = useMemo(
    () => studySlots(activities, date, preferences),
    [activities, date, preferences],
  );

  // FR-3 (docs/features/iterations/daily-planning/daily-planning.i04.md):
  // capacity for whichever day is currently chosen as a move's target, so
  // the move panel can show the same calm over-capacity notice Estimate
  // already uses, before the move is confirmed.
  const movingSession = workSessions.find((session) => session.id === movingSessionId);
  const moveTargetCapacity =
    moveTargetDate !== null
      ? availableMinutes(activities, allSessions, moveTargetDate, preferences)
      : null;
  const moveOverCapacity =
    movingSession !== undefined &&
    moveTargetCapacity !== null &&
    movingSession.plannedMinutes > moveTargetCapacity;

  const chosenIds = Object.keys(chosen);
  const planned = chosenIds.reduce((sum, id) => sum + (chosen[id] ?? 0), 0);
  const over = planned > capacity;

  // date/step are lifted (see PlanPageProps above) so they aren't lost
  // if the tab unmounts, but the local selections they depend on
  // (chosen/times) intentionally are not lifted — FR-2 only requires
  // day/step to survive. If a remount restores a mid-flow step with no
  // matching selections, fall back to Select (now the wizard's landing
  // step — see the Step type above) rather than render an empty/broken
  // Estimate, Schedule, or Confirm screen.
  const safeStep: Step =
    (step === "estimate" || step === "schedule" || step === "confirm") && chosenIds.length === 0
      ? "select"
      : step;

  function pickDay(nextDate: string) {
    onDateChange(nextDate);
    onStepChange("select");
    setChosen({});
    setTimes({});
    setShowAll(false);
    setJustConfirmed(false);
  }

  // The alternative to "Break down ..." offered by BreakdownList/Notice:
  // not every assignment is meaningfully decomposable ("Read chapter 1 by
  // Tuesday"), so this creates a single Work Item mirroring the
  // assignment's own title/estimate via the same service the full
  // breakdown flow's confirm step uses, skipping the multi-step wizard
  // entirely. Recorded as a (trivial, one-item) confirmed Work Breakdown
  // like any other, rather than a separate "unbroken-down but schedulable
  // assignment" concept — see docs/decisions/
  // 20260816-plan-directly-without-breakdown.md.
  async function planWithoutBreakdown(assignment: Assignment) {
    setPlanningAssignmentId(assignment.id);
    setPlanDirectlyError(null);
    try {
      await workBreakdownService.confirmWorkBreakdown(
        studentId,
        assignment,
        [],
        [{ title: assignment.title, effortMinutes: assignment.effortMinutes }],
        0,
      );
      retryAssignments();
    } catch (error) {
      setPlanDirectlyError(errorMessage(error));
    } finally {
      setPlanningAssignmentId(null);
    }
  }

  // FR-3: relocates an already-planned (not-yet-started) session to a
  // different day in one action, instead of the student separately
  // re-planning it elsewhere and removing the original. Create-before-
  // remove — same insert-before-delete ordering this codebase always
  // uses for a multi-step write, so a failure partway through never
  // deletes the original without anything replacing it. Deliberately
  // does not record a Planning Session Domain Event: this mirrors
  // Remove, which is also a single-item plan edit outside the wizard and
  // doesn't record one today — only a full wizard confirm does. See
  // docs/features/iterations/daily-planning/daily-planning.i04.md.
  function startMove(sessionId: string) {
    setMovingSessionId(sessionId);
    setMoveTargetDate(null);
    setMoveError(null);
  }

  function cancelMove() {
    setMovingSessionId(null);
    setMoveTargetDate(null);
    setMoveError(null);
  }

  async function confirmMove(session: WorkSession) {
    if (!moveTargetDate) return;
    setMoveSubmitting(true);
    setMoveError(null);
    try {
      await workSessionService.createWorkSessions(studentId, [
        {
          workItemId: session.workItemId,
          date: moveTargetDate,
          plannedMinutes: session.plannedMinutes,
          // The target day's open slots differ from the original day's,
          // so there's no reliable time to carry over — left unset
          // rather than guessed.
          startTime: null,
        },
      ]);
    } catch (error) {
      setMoveError(errorMessage(error));
      setMoveSubmitting(false);
      return;
    }
    refetchAllSessions();
    const removed = await removeSession(session.id);
    setMoveSubmitting(false);
    // If removal failed, useDailyPlanning's own actionError already
    // surfaces it (rendered near the top of this page); leave the move
    // panel open so the student can see the new session now also exists
    // and retry removing the original from here.
    if (removed) cancelMove();
  }

  function toggleCandidate(itemId: string, estimateMinutes: number) {
    setChosen((prev) => {
      const next = { ...prev };
      if (itemId in next) delete next[itemId];
      else next[itemId] = estimateMinutes;
      return next;
    });
  }

  function adjust(itemId: string, delta: number) {
    setChosen((prev) => ({ ...prev, [itemId]: Math.max(5, (prev[itemId] ?? 0) + delta) }));
  }

  function enterSchedule() {
    setTimes(assignDefaultTimes(chosenIds, chosen, slots));
    onStepChange("schedule");
  }

  async function finish() {
    const succeeded = await confirmPlan(
      chosenIds.map((id) => ({
        workItemId: id,
        plannedMinutes: chosen[id] ?? 0,
        startTime: times[id] ?? null,
      })),
    );
    // Neither Today Execution nor Week Look-ahead exists yet in this
    // codebase to navigate to (both are separate, not-yet-built
    // features) — show an inline success acknowledgment instead. See
    // docs/decisions/20260816-daily-planning-confirm-write-order.md.
    if (succeeded) {
      setJustConfirmed(true);
      // Otherwise scheduledElsewhere wouldn't know about this session
      // until a fresh page load — see FINDING-DP-003.
      refetchAllSessions();
    }
  }

  // FR-1: reached from the breakdown signal on the Day/Select steps
  // below. Reuses WorkBreakdownPage exactly as Assignment Detail does
  // — same component, same confirm flow — rather than a new one.
  // Cancelling or confirming both return to the wizard at the same
  // date/step it was left at, since nothing here touches those; a
  // confirm also refetches so the newly-created Work Items make the
  // assignment show up as a candidate immediately.
  const breakdownAssignment =
    view.name === "breakdown" ? assignments.find((a) => a.id === view.assignmentId) : undefined;

  if (view.name === "breakdown" && breakdownAssignment) {
    return (
      <WorkBreakdownPage
        user={user}
        assignment={breakdownAssignment}
        confirmedItems={workItems.filter((item) => item.assignmentId === breakdownAssignment.id)}
        onCancel={() => setView({ name: "wizard" })}
        onConfirmed={() => {
          setView({ name: "wizard" });
          retryAssignments();
        }}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-[420px] p-6">
      <h1 className="mb-1 text-3xl">Plan</h1>
      <p className="mb-4 text-sm text-muted-foreground">{longPlanDate(date)}</p>

      <div role="tablist" aria-label="Plan view" className="mb-4 flex gap-2">
        <button
          type="button"
          role="tab"
          aria-selected={tab !== "lookahead"}
          onClick={() => onTabChange("wizard")}
          className={`min-h-11 rounded-2xl border px-4 py-2 text-sm font-medium transition-colors ${
            tab !== "lookahead"
              ? "border-primary bg-accent/60 text-foreground"
              : "border-border bg-card text-muted-foreground"
          }`}
        >
          Plan
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "lookahead"}
          onClick={() => onTabChange("lookahead")}
          className={`min-h-11 rounded-2xl border px-4 py-2 text-sm font-medium transition-colors ${
            tab === "lookahead"
              ? "border-primary bg-accent/60 text-foreground"
              : "border-border bg-card text-muted-foreground"
          }`}
        >
          Look ahead
        </button>
      </div>

      {tab === "lookahead" ? (
        <>
          {loadError && <ErrorBanner message="Couldn’t load your plan." onRetry={retry} />}
          {!loading && !loadError && (
            <WeekLookAhead
              studentId={studentId}
              activities={activities}
              assignments={assignments}
              workItems={workItems}
              preferences={preferences}
              today={today}
              courseName={courseName}
              onPickDay={(d) => {
                pickDay(d);
                onTabChange("wizard");
              }}
              onOpenAssignment={onOpenAssignment}
            />
          )}
        </>
      ) : (
        <>
          <div
            role="radiogroup"
            aria-label="Choose a day to plan"
            className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1"
          >
            {Array.from({ length: DAY_STRIP_LENGTH }, (_, i) => addDaysISODate(today, i)).map((d) => {
              const active = d === date;
              return (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => pickDay(d)}
                  className={`min-h-11 shrink-0 rounded-2xl border px-3 py-2 text-xs font-medium transition-colors ${
                    active
                      ? "border-primary bg-accent/60 text-foreground"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {shortDayLabel(d, today)}
                </button>
              );
            })}
          </div>

          {loadError && <ErrorBanner message="Couldn’t load your plan." onRetry={retry} />}

          {actionError && <ErrorBanner message={actionError} />}

          {planDirectlyError && <ErrorBanner message={planDirectlyError} />}

          {!loading && !loadError && (
            <>
              <p className="mb-6 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {STEP_LABEL[safeStep]}
              </p>

              {safeStep === "select" ? (
            <SelectStep
              date={date}
              today={today}
              dueThatDay={dueThatDay}
              onOpenAssignment={onOpenAssignment}
              courseName={courseName}
              commitments={commitments}
              workSessions={workSessions}
              workItems={workItems}
              assignments={assignments}
              movingSessionId={movingSessionId}
              moveTargetDate={moveTargetDate}
              moveSubmitting={moveSubmitting}
              moveError={moveError}
              moveOverCapacity={moveOverCapacity}
              moveTargetCapacity={moveTargetCapacity}
              onStartMove={startMove}
              onCancelMove={cancelMove}
              onSetMoveTargetDate={setMoveTargetDate}
              onConfirmMove={confirmMove}
              onRemoveSession={removeSession}
              capacity={capacity}
              candidates={candidates}
              visibleCandidates={visibleCandidates}
              assignmentsNeedingBreakdown={assignmentsNeedingBreakdown}
              onBreakdown={(assignmentId) => setView({ name: "breakdown", assignmentId })}
              onPlanDirectly={planWithoutBreakdown}
              planningAssignmentId={planningAssignmentId}
              onGoToAssignments={onGoToAssignments}
              chosen={chosen}
              chosenIds={chosenIds}
              onToggleCandidate={toggleCandidate}
              scheduledElsewhere={scheduledElsewhere}
              showAll={showAll}
              onShowAll={() => setShowAll(true)}
              onNext={() => onStepChange("estimate")}
            />
          ) : safeStep === "estimate" ? (
            <EstimateStep
              chosenIds={chosenIds}
              candidates={candidates}
              chosen={chosen}
              onAdjust={adjust}
              planned={planned}
              capacity={capacity}
              over={over}
              drift={drift}
              courseName={courseName}
              onBack={() => onStepChange("select")}
              onNext={enterSchedule}
            />
          ) : safeStep === "schedule" ? (
            <ScheduleStep
              chosenIds={chosenIds}
              candidates={candidates}
              chosen={chosen}
              times={times}
              onTimeChange={(id, value) => setTimes((prev) => ({ ...prev, [id]: value }))}
              slots={slots}
              courseName={courseName}
              onBack={() => onStepChange("estimate")}
              onNext={() => onStepChange("confirm")}
            />
          ) : (
            <ConfirmStep
              justConfirmed={justConfirmed}
              date={date}
              today={today}
              planned={planned}
              capacity={capacity}
              chosenIds={chosenIds}
              times={times}
              chosen={chosen}
              candidates={candidates}
              courseName={courseName}
              onStartExecution={onStartExecution}
              onPlanAnotherDay={() => pickDay(date)}
              onAdjust={() => onStepChange("select")}
              onFinish={finish}
            />
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
