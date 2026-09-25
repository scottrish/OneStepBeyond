import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import ErrorBanner from "../components/ErrorBanner";
import {
  addDaysISODate,
  longPlanDate,
  shortDayLabel,
  todayISODate,
} from "../domain/planningDate";
import {
  preselectFor,
  rankCandidates,
  rankSelectRows,
  targetAssignmentId,
  targetFirst,
  type PlanTarget,
} from "../domain/planningCandidates";
import { activitiesOn, availableMinutes, studySlots } from "../domain/studyCapacity";
import {
  activityBlocks,
  defaultStartTimes,
  rechainTimes,
  sessionBlocks,
} from "../domain/defaultStartTimes";
import { useActivities } from "../hooks/useActivities";
import { useAllWorkSessions } from "../hooks/useAllWorkSessions";
import { useAssignmentsList } from "../hooks/useAssignmentsList";
import { useCourses } from "../hooks/useCourses";
import { useDailyPlanning } from "../hooks/useDailyPlanning";
import { useEstimationDrift } from "../hooks/useEstimationDrift";
import { usePreferences } from "../hooks/usePreferences";
import type { Assignment } from "../services/assignmentService";
import type { WorkSession } from "../services/workSessionService";
import ConfirmStep from "./plan/ConfirmStep";
import DayView from "./plan/DayView";
import SessionSheet from "./plan/SessionSheet";
import EstimateStep from "./plan/EstimateStep";
import ScheduleStep from "./plan/ScheduleStep";
import SelectStep from "./plan/SelectStep";
import { MIDNIGHT_MESSAGE, useSessionEditing } from "./plan/useSessionEditing";
import WeekLookAhead from "./WeekLookAhead";
import TurnedInReminder from "@/components/TurnedInReminder";
import ReflectionPrompt from "./ReflectionPrompt";

// Step and the selected day are lifted into App.tsx and passed down as
// controlled props (date/step + onDateChange/onStepChange) instead of
// local useState, so they survive PlanPage unmounting when the student
// switches to another bottom-nav tab and back — see
// docs/features/iterations/daily-planning/daily-planning.i02.md FR-2.
// Everything else in the wizard (chosen items, times, show-more, the
// just-confirmed acknowledgment) stays local: FR-2's acceptance criteria
// only require the day/step to survive, not in-progress selections.
//
// "day" is the chosen day's *landing* view, not a numbered wizard step:
// it renders the existing-day view when the day already has unfinished
// work, and Select otherwise (docs/decisions/20260925-existing-day-view.md).
// Picking a day, confirming, and fresh entries set "day"; entries that
// mean "add work" (the day view's own Add more work, Assignment Detail's
// "Plan work for today", Home's Needs Attention actions) set "select"
// directly. Deciding at render time, rather than redirecting after the
// day's sessions load, means no flash of the wrong view. (The old,
// always-shown "day" gate removed by 20260818-plan-day-step-removed.md is
// not coming back: an empty day still lands straight on Select.)
export type Step = "day" | "select" | "estimate" | "schedule" | "confirm";
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
  // Plan opened for one assignment or one step (daily-planning-and-
  // completion-v2-proposal.md item 1). Applied once, after the data it
  // needs has loaded; then onTargetApplied lets App clear it, so a later
  // remount doesn't re-apply a stale target over the student's choices.
  target: PlanTarget | null;
  onTargetApplied: () => void;
};

// A full-screen step within the Plan tab, distinct from both the wizard's
// own `step` and the top-level wizard/lookahead `tab` above: finishing an
// assignment from Select's "All steps done" row — the reflection (it
// always had steps), then the turned-in reminder, then back to the same
// Select (docs/decisions/20260925-plan-rows-and-one-piece.md, R1). Plan
// no longer hosts a breakdown: that lives on Assignment Detail now.
type View =
  | { name: "wizard" }
  | { name: "reflect"; assignment: Assignment }
  | { name: "reminder"; assignment: Assignment };

const STEP_LABEL: Record<Exclude<Step, "day">, string> = {
  select: "Step 1 of 4",
  estimate: "Step 2 of 4",
  schedule: "Step 3 of 4",
  confirm: "Step 4 of 4",
};

// Today + next 4 days (docs/features/daily-planning.md's day picker strip
// — see the `View` union above for the "Look ahead" tab it also
// mentions, week-lookahead.md's own separate 7-day view).
const DAY_STRIP_LENGTH = 5;


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
  target,
  onTargetApplied,
}: PlanPageProps) {
  const studentId = user.id;
  const today = useMemo(() => todayISODate(), []);

  const [view, setView] = useState<View>({ name: "wizard" });
  const [chosen, setChosen] = useState<Record<string, number>>({});
  const [times, setTimes] = useState<Record<string, string>>({});
  // The Schedule step's draft order — set on entering Schedule, changed by
  // drag or Earlier/Later, held in memory until Confirm like `times`.
  const [scheduleOrder, setScheduleOrder] = useState<string[]>([]);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [justConfirmed, setJustConfirmed] = useState(false);
  // Keeps the day view showing after the student removes the day's last
  // session from it ("Nothing planned for this day yet."), instead of the
  // screen switching to Select underneath them. Cleared by leaving the
  // day (another day picked, Add more work, Done).
  const [stayOnDayViewFor, setStayOnDayViewFor] = useState<string | null>(null);

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
    actionError: assignmentsActionError,
    completeAssignment,
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
    retimeSessions,
  } = useDailyPlanning(studentId, date);
  const drift = useEstimationDrift(studentId);
  const {
    sessions: allSessions,
    loading: allSessionsLoading,
    refetch: refetchAllSessions,
  } = useAllWorkSessions(studentId);
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

  // The target this wizard pass was opened for. Kept after App clears the
  // prop, so its rows stay first and marked until the student leaves the
  // day (pickDay / addMoreWork reset it).
  const [appliedTarget, setAppliedTarget] = useState<PlanTarget | null>(null);
  const candidates = useMemo(() => {
    const ranked = rankCandidates(assignments, workItems);
    return targetFirst(ranked, targetAssignmentId(appliedTarget, ranked));
  }, [assignments, workItems, appliedTarget]);
  const highlightedAssignmentId = targetAssignmentId(appliedTarget, candidates);
  // Select's rows: open steps, plus "no steps yet" and "all steps done"
  // assignments (item 4), all shown — no three-row cap (item 6a;
  // docs/decisions/20260925-plan-rows-and-one-piece.md).
  const selectRows = useMemo(
    () => targetFirst(rankSelectRows(assignments, workItems), highlightedAssignmentId),
    [assignments, workItems, highlightedAssignmentId],
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

  // Work items that already have a not-done session on the chosen day,
  // with their total minutes — Select marks these "Planned today" and
  // won't let them be added again (items 6b/6c of
  // docs/features/daily-planning-and-completion-v2-proposal.md; needed now
  // that confirming appends — docs/decisions/20260925-confirm-plan-appends.md).
  const plannedOnDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const session of workSessions) {
      if (session.date === date && session.status !== "done") {
        map.set(session.workItemId, (map.get(session.workItemId) ?? 0) + session.plannedMinutes);
      }
    }
    return map;
  }, [workSessions, date]);

  // Apply a new target once its data has loaded — during render (React's
  // "adjust state when a prop changes" pattern), not in an effect, so the
  // pre-selection appears in the same paint as the list.
  if (target && target !== appliedTarget && !loading && !loadError && !allSessionsLoading) {
    const ranked = rankCandidates(assignments, workItems);
    const picked = preselectFor(target, ranked, allSessions, date, new Set(plannedOnDay.keys()));
    setAppliedTarget(target);
    setChosen(
      Object.fromEntries(
        picked.map((id) => [id, ranked.find((c) => c.workItem.id === id)!.workItem.effortMinutes]),
      ),
    );
    setTimes({});
  }

  useEffect(() => {
    if (target && target === appliedTarget) onTargetApplied();
  }, [target, appliedTarget, onTargetApplied]);

  const capacity = availableMinutes(activities, workSessions, date, preferences);
  const commitments = activitiesOn(activities, date);
  const dueThatDay = assignments.filter(
    (assignment) => !assignment.completedAt && assignment.dueDate === date,
  );
  const slots = useMemo(
    () => studySlots(activities, date, preferences),
    [activities, date, preferences],
  );

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
      ? "day"
      : step;

  // The day's landing view: its plan if it has unfinished work (or the
  // student just emptied it from the day view), otherwise Select.
  const dayHasPlan = workSessions.some(
    (session) => session.date === date && session.status !== "done",
  );
  const showDayView = safeStep === "day" && (dayHasPlan || stayOnDayViewFor === date);
  const wizardStep: Exclude<Step, "day"> = safeStep === "day" ? "select" : safeStep;

  function sessionTitle(session: WorkSession): string {
    return workItems.find((item) => item.id === session.workItemId)?.title ?? "Study session";
  }

  const editing = useSessionEditing({
    studentId,
    date,
    workSessions,
    slots,
    commitments,
    titleOf: sessionTitle,
    removeSession,
    retimeSessions,
    onSessionsChanged: refetchAllSessions,
    onKeepDayView: () => setStayOnDayViewFor(date),
  });

  // FR-3 (docs/features/iterations/daily-planning/daily-planning.i04.md):
  // capacity for whichever day is currently chosen as a move's target, so
  // the edit sheet can show the same calm over-capacity notice Estimate
  // already uses, before the move is confirmed.
  const { editingSession, moveTargetDate } = editing;
  const moveTargetCapacity =
    moveTargetDate !== null
      ? availableMinutes(activities, allSessions, moveTargetDate, preferences)
      : null;
  const moveOverCapacity =
    editingSession !== undefined &&
    moveTargetCapacity !== null &&
    editingSession.plannedMinutes > moveTargetCapacity;

  function pickDay(nextDate: string) {
    onDateChange(nextDate);
    onStepChange("day");
    setChosen({});
    setTimes({});
    setJustConfirmed(false);
    setStayOnDayViewFor(null);
    setAppliedTarget(null);
    editing.closeEditor();
  }

  // The day view's "Add more work": the wizard for the same day. Confirming
  // adds to what's already there (docs/decisions/20260925-confirm-plan-appends.md).
  function addMoreWork() {
    setAppliedTarget(null);
    setChosen({});
    setTimes({});
    setJustConfirmed(false);
    setStayOnDayViewFor(null);
    onStepChange("select");
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

  // Confirming *adds* to the day (docs/decisions/
  // 20260925-confirm-plan-appends.md), so new work defaults after what's
  // already there: the day's existing sessions and its activities
  // (with travel), not just the study windows.
  // What the Schedule step's drafts must fit around: the day's existing
  // sessions (any status) and its activities, with travel.
  function scheduleBusy() {
    return [
      ...sessionBlocks(workSessions.filter((session) => session.date === date)),
      ...activityBlocks(commitments),
    ];
  }

  function enterSchedule() {
    const existing = sessionBlocks(workSessions.filter((session) => session.date === date));
    setScheduleOrder(chosenIds);
    setScheduleError(null);
    setTimes(
      defaultStartTimes(
        chosenIds.map((id) => ({ id, minutes: chosen[id] ?? 0 })),
        slots,
        scheduleBusy(),
        Math.max(0, ...existing.map((block) => block.end)),
      ),
    );
    onStepChange("schedule");
  }

  // Reordering the Schedule step's drafts (drag or Earlier/Later)
  // re-chains their times in memory; nothing is saved until Confirm
  // (daily-planning-and-completion-v2-proposal.md item 2).
  function reorderDrafts(orderedIds: string[]) {
    setScheduleError(null);
    const next = rechainTimes(
      orderedIds.map((id) => ({ id, minutes: chosen[id] ?? 0, startTime: times[id] ?? null })),
      slots,
      scheduleBusy(),
    );
    if (!next) {
      setScheduleError(MIDNIGHT_MESSAGE);
      return;
    }
    setScheduleOrder(orderedIds);
    setTimes((prev) => ({ ...prev, ...next }));
  }

  // Drops an item from the draft (swipe or its menu's Remove); nothing
  // had been saved for it.
  function removeDraft(itemId: string) {
    setScheduleOrder((prev) => prev.filter((id) => id !== itemId));
    setChosen((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    setTimes((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
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
      // Land on the day's plan, now including what was just added, with a
      // short "Plan confirmed." note (docs/decisions/
      // 20260925-existing-day-view.md point 4).
      setChosen({});
      setTimes({});
      setJustConfirmed(true);
      onStepChange("day");
      // Otherwise scheduledElsewhere wouldn't know about this session
      // until a fresh page load — see FINDING-DP-003.
      refetchAllSessions();
    }
  }

  // Select's "All steps done" row → "Mark it complete".
  async function finishAssignment(assignment: Assignment) {
    const completed = await completeAssignment(assignment.id);
    if (completed) setView({ name: "reflect", assignment });
  }

  if (view.name === "reflect") {
    return (
      <ReflectionPrompt
        studentId={studentId}
        assignmentId={view.assignment.id}
        onDone={() => setView({ name: "reminder", assignment: view.assignment })}
      />
    );
  }

  if (view.name === "reminder") {
    return (
      <TurnedInReminder title={view.assignment.title} onDone={() => setView({ name: "wizard" })} />
    );
  }

  return (
    <div>
      {/* docs/features/mobile-app-shell-and-touch-ergonomics-v0.1.md §4: the
          "Step N of 4" label sits in a pill beside the title rather than on
          its own line above the step, saving vertical space on phones. */}
      <div className="mb-1 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <h1 className="text-[clamp(1.65rem,7vw,2.1rem)] leading-tight">Plan</h1>
        {tab !== "lookahead" && !loading && !loadError && !showDayView && (
          <span className="mt-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
            {STEP_LABEL[wizardStep]}
          </span>
        )}
      </div>
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
                  className={`min-h-11 min-w-11 shrink-0 rounded-2xl border px-3 py-2 text-xs font-medium transition-colors ${
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

          {assignmentsActionError && <ErrorBanner message={assignmentsActionError} />}

          {!loading && !loadError && (
            <>
              {showDayView ? (
            <DayView
              date={date}
              today={today}
              capacity={capacity}
              dueThatDay={dueThatDay}
              commitments={commitments}
              workSessions={workSessions}
              workItems={workItems}
              assignments={assignments}
              courseName={courseName}
              justConfirmed={justConfirmed}
              onOpenAssignment={onOpenAssignment}
              sessionTitle={sessionTitle}
              reorderError={editing.reorderError}
              onDismissReorderError={editing.dismissReorderError}
              onReorder={(ids) => void editing.reorder(ids)}
              onEditSession={editing.openEditor}
              onRemoveSession={editing.removeFromDay}
              onStartExecution={onStartExecution}
              onAddMore={addMoreWork}
              onDone={() => onTabChange("lookahead")}
            />
          ) : wizardStep === "select" ? (
            <SelectStep
              date={date}
              today={today}
              dueThatDay={dueThatDay}
              onOpenAssignment={onOpenAssignment}
              courseName={courseName}
              commitments={commitments}
              capacity={capacity}
              rows={selectRows}
              onFinishAssignment={finishAssignment}
              onGoToAssignments={onGoToAssignments}
              chosen={chosen}
              chosenIds={chosenIds}
              onToggleCandidate={toggleCandidate}
              scheduledElsewhere={scheduledElsewhere}
              plannedOnDay={plannedOnDay}
              highlightedAssignmentId={highlightedAssignmentId}
              onNext={() => onStepChange("estimate")}
            />
          ) : wizardStep === "estimate" ? (
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
          ) : wizardStep === "schedule" ? (
            <ScheduleStep
              order={scheduleOrder.filter((id) => id in chosen)}
              error={scheduleError}
              onDismissError={() => setScheduleError(null)}
              onReorder={reorderDrafts}
              onRemove={removeDraft}
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
              date={date}
              today={today}
              planned={planned}
              capacity={capacity}
              chosenIds={chosenIds}
              times={times}
              chosen={chosen}
              candidates={candidates}
              courseName={courseName}
              addingToExisting={dayHasPlan}
              onAdjust={() => onStepChange("select")}
              onFinish={finish}
            />
              )}
            </>
          )}
        </>
      )}

      <SessionSheet
        session={editingSession}
        title={editingSession ? sessionTitle(editingSession) : "Study session"}
        date={date}
        today={today}
        slots={slots}
        isFree={editing.isFree}
        retimeError={editing.retimeError}
        onDismissRetimeError={editing.dismissRetimeError}
        onRetime={(session, startTime) => void editing.retime(session, startTime)}
        canMoveEarlier={editingSession !== undefined && editing.plannedOrder[0] !== editingSession.id}
        canMoveLater={
          editingSession !== undefined && editing.plannedOrder.at(-1) !== editingSession.id
        }
        onMove={(session, direction) => editing.moveEarlierOrLater(session, direction)}
        reorderError={editing.reorderError}
        onDismissReorderError={editing.dismissReorderError}
        moveTargetDate={moveTargetDate}
        moveSubmitting={editing.moveSubmitting}
        moveError={editing.moveError}
        moveOverCapacity={moveOverCapacity}
        moveTargetCapacity={moveTargetCapacity}
        onSetMoveTargetDate={editing.setMoveTargetDate}
        onConfirmMove={(session) => void editing.confirmMove(session)}
        onRemove={(session) => void editing.removeFromDay(session)}
        onClose={editing.closeEditor}
      />
    </div>
  );
}
