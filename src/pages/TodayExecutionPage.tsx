import { useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import TurnedInReminder from "@/components/TurnedInReminder";
import ContentPlaceholder from "../components/ContentPlaceholder";
import ErrorBanner from "../components/ErrorBanner";
import { REFRESH_FAILED } from "../lib/errorMessage";
import { activityBlocks, sessionBlocks } from "../domain/defaultStartTimes";
import { effortLabel } from "../domain/effortPresets";
import {
  isDueBeforeTomorrow,
  isDueTodayOrEarlier,
  laterTodayStart,
  type ExecutionStage,
  type FrictionKind,
  type Intervention,
  type InterventionAction,
} from "../domain/executionCoaching";
import { estimateLabel, otherOpenSessionsFor } from "../domain/executionTiming";
import { isAssignmentFinishable } from "../domain/planningCandidates";
import { addDaysISODate, longPlanDate, todayISODate } from "../domain/planningDate";
import { activitiesOn, studySlots } from "../domain/studyCapacity";
import { sortByStartTime } from "../domain/sessionOrder";
import { useActivities } from "../hooks/useActivities";
import { useAllWorkSessions } from "../hooks/useAllWorkSessions";
import { useAssignmentsList } from "../hooks/useAssignmentsList";
import { useCourses } from "../hooks/useCourses";
import { useExecutionCoaching } from "../hooks/useExecutionCoaching";
import { usePreferences } from "../hooks/usePreferences";
import { useReflection } from "../hooks/useReflection";
import { useTodayExecution } from "../hooks/useTodayExecution";
import type { Assignment } from "../services/assignmentService";
import type { WorkSession } from "../services/workSessionService";
import ReflectionPrompt from "./ReflectionPrompt";
import { FrictionSheet, InterventionSheet, OwnActionSheet, RepairSheet } from "./today/CoachingSheets";
import CompletionCheck from "./today/CompletionCheck";
import SessionReflection from "./today/SessionReflection";
import TaskCard from "./today/TaskCard";

type TodayExecutionPageProps = {
  user: User;
  // "Change today's plan" escape hatch, the empty-state link into
  // Planning, and the all-done screen's own way back — all the same
  // action (docs/features/today-execution.md).
  onBack: () => void;
  // "Revisit the breakdown" / "Look at the breakdown": Assignment Detail,
  // where steps are edited. Closing it comes back here.
  onOpenAssignment: (assignmentId: string) => void;
  // "Choose another day": Plan, on today's plan, where a session can be
  // moved to another day.
  onChangePlan: () => void;
};

// The coaching sheet showing, if any (execution-coaching-v0.1.md). Each
// carries the interaction it belongs to (null if recording it failed —
// the student carries on regardless).
type Overlay =
  | { kind: "none" }
  | { kind: "friction"; stage: ExecutionStage }
  | { kind: "intervention"; interactionId: string | null; intervention: Intervention }
  | { kind: "ownAction"; interactionId: string | null; intervention: Intervention }
  | { kind: "repair"; interactionId: string | null; intervention: Intervention | null; nowMinutes: number };

// Coaching (part 12b): "I'm stuck" / "Not now" / "Need more time" open
// the sheets in ./today/CoachingSheets — what's in the way, one
// intervention, an optional own first step, or rescheduling. All
// student-initiated; nothing appears on its own.
//
// What happens after Done (execution-coaching-v0.1.md, "Completion-time
// checks"; docs/decisions/20260925-execution-timing.md):
// - "Is the whole task done?" — only if the step has other open sessions;
// - "Is the whole assignment done?" — only if that was its last open step;
//   Yes → the breakdown reflection → the turned-in reminder (E3: the
//   session question is skipped then — one reflection is enough);
// - otherwise, the usual session question.
type Finish =
  | { stage: "task"; session: WorkSession; others: WorkSession[] }
  | { stage: "assignment"; session: WorkSession; assignment: Assignment }
  | { stage: "breakdownReflection"; assignment: Assignment }
  | { stage: "reminder"; assignment: Assignment }
  | { stage: "sessionReflection"; session: WorkSession };

export default function TodayExecutionPage({
  user,
  onBack,
  onOpenAssignment,
  onChangePlan,
}: TodayExecutionPageProps) {
  const studentId = user.id;
  const today = useMemo(() => todayISODate(), []);

  const {
    sessions,
    loading: sessionsLoading,
    loadError: sessionsLoadError,
    refreshError: sessionsRefreshError,
    actionError,
    retry: retrySessions,
    start,
    complete,
    needMoreTime,
    reschedule,
  } = useTodayExecution(studentId, today);
  const {
    assignments,
    workItems,
    loading: assignmentsLoading,
    loadError: assignmentsLoadError,
    refreshError: assignmentsRefreshError,
    retry: retryAssignments,
    actionError: assignmentActionError,
    completeAssignment,
  } = useAssignmentsList(studentId);
  // Every day's sessions: finishing asks about the step's time on other days.
  const {
    sessions: allSessions,
    loading: allSessionsLoading,
    refetch: refetchAllSessions,
  } = useAllWorkSessions(studentId);
  const { courses } = useCourses(studentId);
  // For "Later today": the day's activities and study windows.
  const { activities } = useActivities(studentId);
  const { preferences } = usePreferences(studentId);
  const coaching = useExecutionCoaching(studentId);
  const { actionError: reflectionError, submitReflection } = useReflection(studentId);

  const [overlay, setOverlay] = useState<Overlay>({ kind: "none" });
  const [finish, setFinish] = useState<Finish | null>(null);
  const [busy, setBusy] = useState(false);

  const loading = sessionsLoading || assignmentsLoading || allSessionsLoading;
  const loadError = sessionsLoadError ?? assignmentsLoadError;
  // Showing the last-known copy, but refreshing it failed (instant
  // screens, I3): the content stays, with a banner above it.
  const refreshError = sessionsRefreshError ?? assignmentsRefreshError;

  function retry() {
    retrySessions();
    retryAssignments();
  }

  function courseName(courseId: string): string {
    return courses.find((course) => course.id === courseId)?.name ?? "Course";
  }

  function contextFor(session: WorkSession) {
    const item = workItems.find((w) => w.id === session.workItemId);
    const assignment = item ? assignments.find((a) => a.id === item.assignmentId) : undefined;
    return { item, assignment };
  }

  // Exactly one current task at a time — the first not-done session for
  // today — plus a lightweight "After that" list, per the spec.
  const activeSessions = useMemo(
    () => sortByStartTime(sessions.filter((session) => session.status !== "done")),
    [sessions],
  );
  const current = activeSessions[0];
  const upNext = activeSessions.slice(1);
  const allDone = sessions.length > 0 && activeSessions.length === 0;

  function handleDone(session: WorkSession) {
    // Today's own list is current; other days come from the all-days load.
    const everyDay = [...sessions, ...allSessions.filter((s) => s.date !== today)];
    const others = otherOpenSessionsFor(session, everyDay);
    if (others.length > 0) setFinish({ stage: "task", session, others });
    else void finishSession(session, { closeStep: true, clear: [] });
  }

  async function finishSession(
    session: WorkSession,
    { closeStep, clear }: { closeStep: boolean; clear: WorkSession[] },
  ) {
    setBusy(true);
    const completed = await complete(session.id, {
      closeStep,
      clearSessionIds: clear.map((s) => s.id),
    });
    setBusy(false);
    if (!completed) {
      setFinish(null);
      return;
    }
    if (clear.length > 0) refetchAllSessions();

    const { assignment } = contextFor(session);
    if (closeStep && assignment) {
      const doneNow = new Date().toISOString();
      const items = workItems.map((item) =>
        item.id === session.workItemId ? { ...item, completedAt: doneNow } : item,
      );
      if (isAssignmentFinishable(assignment, items)) {
        setFinish({ stage: "assignment", session, assignment });
        return;
      }
    }
    setFinish({ stage: "sessionReflection", session });
  }

  async function finishAssignment(assignment: Assignment) {
    setBusy(true);
    const completed = await completeAssignment(assignment.id);
    setBusy(false);
    // It always had steps (that's what made it finishable), so the
    // breakdown reflection comes first (manual-work-breakdown-reflection-v0.1.md §9).
    if (completed) setFinish({ stage: "breakdownReflection", assignment });
  }

  async function handleSessionReflection(session: WorkSession, choice: string | null) {
    setFinish(null);
    if (choice === null) return;
    const { assignment } = contextFor(session);
    if (!assignment) return;
    await submitReflection({
      assignmentId: assignment.id,
      trigger: "work_session_reflection",
      structuredResponse: choice,
      freeText: null,
      proposedAdjustment: null,
    });
  }

  // ——— Coaching (execution-coaching-v0.1.md) ———

  const closeOverlay = () => setOverlay({ kind: "none" });

  // A reported friction: record it, then offer its one intervention.
  async function reportFriction(session: WorkSession, stage: ExecutionStage, kind: FrictionKind) {
    const { item, assignment } = contextFor(session);
    if (!assignment) return closeOverlay();
    const { interactionId, intervention } = await coaching.report({
      assignmentId: assignment.id,
      workItemId: item?.id ?? null,
      workSessionId: session.id,
      stage,
      frictionKind: kind,
    });
    setOverlay({ kind: "intervention", interactionId, intervention });
  }

  function nowMinutes(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  function openRepair(interactionId: string | null, intervention: Intervention | null) {
    setOverlay({ kind: "repair", interactionId, intervention, nowMinutes: nowMinutes() });
  }

  function handleInterventionAction(session: WorkSession, action: InterventionAction) {
    if (overlay.kind !== "intervention") return;
    const { interactionId, intervention } = overlay;
    coaching.resolve(interactionId, intervention, { response: "selected", actionId: action.id });
    switch (action.effect) {
      case "return_to_task":
        return closeOverlay();
      case "own_first_action":
        return setOverlay({ kind: "ownAction", interactionId, intervention });
      case "add_ten_minutes":
        closeOverlay();
        return void needMoreTime(session.id);
      case "open_breakdown": {
        closeOverlay();
        const { assignment } = contextFor(session);
        if (assignment) onOpenAssignment(assignment.id);
        return;
      }
      case "open_repair":
        return openRepair(interactionId, intervention);
    }
  }

  function dismissIntervention() {
    if (overlay.kind !== "intervention") return;
    coaching.resolve(overlay.interactionId, overlay.intervention, { response: "dismissed" });
    closeOverlay();
  }

  async function repairTo(session: WorkSession, toDate: string, startTime: string | null) {
    if (overlay.kind !== "repair") return;
    const { interactionId, intervention } = overlay;
    closeOverlay();
    const moved = await reschedule(session.id, toDate, startTime);
    if (moved) coaching.resolve(interactionId, intervention, { response: "replanned" });
  }

  if (finish?.stage === "task") {
    const { session, others } = finish;
    return (
      <CompletionCheck
        eyebrow="Before you finish"
        title="Is the whole task done?"
        subject={contextFor(session).item?.title ?? "Study session"}
        detail={`You also have time set aside for this on ${others
          .map((o) => `${longPlanDate(o.date)} · ${effortLabel(o.plannedMinutes)}`)
          .join(", ")}.`}
        yesLabel="Yes — clear the other time"
        noLabel="Not yet — keep the rest of the plan"
        busy={busy}
        onYes={() => void finishSession(session, { closeStep: true, clear: others })}
        onNo={() => void finishSession(session, { closeStep: false, clear: [] })}
      />
    );
  }

  if (finish?.stage === "assignment") {
    const { session, assignment } = finish;
    return (
      <>
        <CompletionCheck
          eyebrow="That was the last step"
          title="Is the whole assignment done?"
          subject={assignment.title}
          yesLabel="Yes, mark it complete"
          noLabel="Not yet"
          busy={busy}
          onYes={() => void finishAssignment(assignment)}
          onNo={() => setFinish({ stage: "sessionReflection", session })}
        />
        {assignmentActionError && <ErrorBanner message={assignmentActionError} className="mt-4" />}
      </>
    );
  }

  if (finish?.stage === "breakdownReflection") {
    const { assignment } = finish;
    return (
      <ReflectionPrompt
        studentId={studentId}
        assignmentId={assignment.id}
        onDone={() => setFinish({ stage: "reminder", assignment })}
      />
    );
  }

  if (finish?.stage === "reminder") {
    return <TurnedInReminder title={finish.assignment.title} onDone={() => setFinish(null)} />;
  }

  if (finish?.stage === "sessionReflection") {
    const { session } = finish;
    return (
      <SessionReflection
        error={reflectionError}
        onAnswer={(choice) => void handleSessionReflection(session, choice)}
      />
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-[clamp(1.65rem,7vw,2.1rem)] leading-tight">Today</h1>

      {loadError && <ErrorBanner message="Couldn’t load today’s plan." onRetry={retry} />}
      {!loadError && refreshError && <ErrorBanner message={REFRESH_FAILED} onRetry={retry} />}
      {/* First visit this session: quiet shapes, not a blank area (I2). */}
      {loading && !loadError && <ContentPlaceholder blocks={2} />}

      {actionError && <ErrorBanner message={actionError} />}

      {!loading && !loadError && (
        <>
          {sessions.length === 0 ? (
            <EmptyState
              title="Nothing planned for today yet."
              hint="Planning takes about five minutes and makes the rest of the day easier."
              action={<Button onClick={onBack}>Plan today</Button>}
            />
          ) : allDone ? (
            <section>
              <h2 className="mb-3 text-xl font-medium text-foreground">
                That&rsquo;s everything for today.
              </h2>
              <p className="text-sm text-muted-foreground">
                You did what you said you would. The evening is yours.
              </p>
              <Button variant="ghost" className="mt-6 rounded-2xl" onClick={onBack}>
                Back to Plan
              </Button>
            </section>
          ) : current ? (
            <section>
              {(() => {
                const { item, assignment } = contextFor(current);
                return (
                  <TaskCard
                    session={current}
                    title={item?.title ?? "Study session"}
                    context={
                      item && assignment ? `${assignment.title} · ${courseName(assignment.courseId)}` : null
                    }
                    onStart={() => void start(current.id)}
                    onDone={() => handleDone(current)}
                    onStuck={() =>
                      setOverlay({
                        kind: "friction",
                        stage: current.status === "planned" ? "before_start" : "in_progress",
                      })
                    }
                    onNotNow={() => openRepair(null, null)}
                    // Straight to "Your first estimate may need updating."
                    onNeedMoreTime={() => void reportFriction(current, "in_progress", "taking_longer")}
                  />
                );
              })()}

              {upNext.length > 0 && (
                <>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">After that</h3>
                  <ul className="mb-4 flex flex-col gap-1">
                    {upNext.map((session) => {
                      const { item } = contextFor(session);
                      return (
                        <li
                          key={session.id}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {item?.title ?? "Study session"}
                          </span>
                          <span className="shrink-0 text-xs">{estimateLabel(session)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              <Button variant="ghost" className="text-xs text-muted-foreground" onClick={onBack}>
                Change today&rsquo;s plan
              </Button>

              <FrictionSheet
                stage={overlay.kind === "friction" ? overlay.stage : null}
                onChoose={(kind) => {
                  if (overlay.kind === "friction") void reportFriction(current, overlay.stage, kind);
                }}
                onClose={closeOverlay}
              />
              <InterventionSheet
                intervention={overlay.kind === "intervention" ? overlay.intervention : null}
                onAction={(action) => handleInterventionAction(current, action)}
                onDismiss={dismissIntervention}
              />
              <OwnActionSheet
                open={overlay.kind === "ownAction"}
                prompt={overlay.kind === "ownAction" ? overlay.intervention.ownActionPrompt : undefined}
                onSave={(text) => {
                  if (overlay.kind === "ownAction") {
                    coaching.resolve(overlay.interactionId, overlay.intervention, { note: text });
                  }
                  closeOverlay();
                }}
                onSkip={closeOverlay}
              />
              {(() => {
                const { assignment } = contextFor(current);
                const laterTodayAt =
                  overlay.kind === "repair"
                    ? laterTodayStart(
                        current.plannedMinutes,
                        sessionBlocks(sessions.filter((s) => s.id !== current.id && s.status !== "done")),
                        activityBlocks(activitiesOn(activities, today)),
                        studySlots(activities, today, preferences),
                        overlay.nowMinutes,
                      )
                    : null;
                return (
                  <RepairSheet
                    open={overlay.kind === "repair"}
                    dueTodayOrEarlier={assignment ? isDueTodayOrEarlier(assignment.dueDate, today) : false}
                    dueBeforeTomorrow={assignment ? isDueBeforeTomorrow(assignment.dueDate, today) : false}
                    laterTodayAt={laterTodayAt}
                    onLaterToday={() => {
                      if (laterTodayAt) void repairTo(current, today, laterTodayAt);
                    }}
                    onTomorrow={() => void repairTo(current, addDaysISODate(today, 1), null)}
                    onAnotherDay={() => {
                      closeOverlay();
                      onChangePlan();
                    }}
                    onCancel={closeOverlay}
                  />
                );
              })()}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
