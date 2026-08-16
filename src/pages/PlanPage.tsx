import { useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Check, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import { errorMessage } from "../lib/errorMessage";
import { effortLabel } from "../domain/effortPresets";
import {
  addDaysISODate,
  dayLabel,
  dueRelativeLabel,
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
import * as workBreakdownService from "../services/workBreakdownService";
import type { Assignment } from "../services/assignmentService";
import WorkBreakdownPage from "./WorkBreakdownPage";

// Step and the selected day are lifted into App.tsx and passed down as
// controlled props (date/step + onDateChange/onStepChange) instead of
// local useState, so they survive PlanPage unmounting when the student
// switches to another bottom-nav tab and back — see
// docs/features/iterations/daily-planning/daily-planning.i02.md FR-2.
// Everything else in the wizard (chosen items, times, show-more, the
// just-confirmed acknowledgment) stays local: FR-2's acceptance criteria
// only require the day/step to survive, not in-progress selections.
export type Step = "day" | "select" | "estimate" | "schedule" | "confirm";

type PlanPageProps = {
  user: User;
  date: string;
  step: Step;
  onDateChange: (date: string) => void;
  onStepChange: (step: Step) => void;
};

// A nested view within the Plan tab, distinct from the wizard's own
// `step`. Reached from FR-1's breakdown signal (see needsBreakdown
// below) — reuses WorkBreakdownPage exactly as Assignment Detail does,
// rather than inventing a new UI for the same job (CLAUDE.md YAGNI).
type View = { name: "wizard" } | { name: "breakdown"; assignmentId: string };

const STEP_LABEL: Record<Step, string> = {
  day: "Step 1 of 5",
  select: "Step 2 of 5",
  estimate: "Step 3 of 5",
  schedule: "Step 4 of 5",
  confirm: "Step 5 of 5",
};

// Today + next 4 days (docs/features/daily-planning.md's day picker strip
// — the "Look ahead" tab it also mentions is week-lookahead.md's own
// separate feature, not built here).
const DAY_STRIP_LENGTH = 5;

const errorBoxStyle =
  "mb-4 rounded-lg border border-destructive bg-card p-3 text-sm text-card-foreground";

// Same local 12-hour formatter ActivitiesPage.tsx already uses for
// Activity times — presentation-only, not shared as a domain module for
// the same reason that file keeps its own copy.
function timeLabel(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const twelveHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelveHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

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

// The pair of actions shown by FR-1's signal for each assignment that
// hasn't been broken down yet, shared between the Day step's notice and
// Select's own notice (both the all-candidates-need-it dead end and the
// mixed case) so the markup isn't duplicated. Not every assignment
// benefits from decomposition — a short, atomic task ("Read chapter 1 by
// Tuesday") gains nothing from a forced multi-step breakdown, so
// "Plan ... as one task" is offered as an equally direct alternative to
// "Break down ...", not buried behind it. It creates a single Work Item
// matching the assignment's own title/estimate via the same
// workBreakdownService.confirmWorkBreakdown the full breakdown flow uses
// (see planWithoutBreakdown below) — reusing the existing abstraction
// rather than a parallel "unbroken-down schedulable assignment" concept.
function BreakdownList({
  assignments,
  onBreakdown,
  onPlanDirectly,
  planningAssignmentId,
}: {
  assignments: Assignment[];
  onBreakdown: (assignmentId: string) => void;
  onPlanDirectly: (assignment: Assignment) => void;
  planningAssignmentId: string | null;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {assignments.map((assignment) => (
        <li key={assignment.id} className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full justify-start rounded-2xl text-left"
            onClick={() => onBreakdown(assignment.id)}
          >
            Break down &ldquo;{assignment.title}&rdquo;
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={planningAssignmentId === assignment.id}
            className="min-h-11 w-full justify-start rounded-2xl text-left text-muted-foreground"
            onClick={() => onPlanDirectly(assignment)}
          >
            {planningAssignmentId === assignment.id
              ? "Planning…"
              : `Plan “${assignment.title}” as one task instead`}
          </Button>
        </li>
      ))}
    </ul>
  );
}

// The inline "these assignments still need breaking down" notice, shown
// on the Day step and — critically — also within Select whenever some
// (not necessarily all) of the day's assignments need it. Iteration 2's
// assessment (FINDING-DP-001, docs/features/iterations/daily-planning/
// daily-planning.i03.md) found the previous version of this signal only
// fired when Select's candidate list was entirely empty, so a day with a
// mix of already-broken-down and not-yet-broken-down assignments silently
// omitted the latter with no explanation at all. This component is now
// rendered whenever assignmentsNeedingBreakdown is non-empty, regardless
// of whether other, already-selectable candidates also exist.
function BreakdownNotice({
  assignments,
  onBreakdown,
  onPlanDirectly,
  planningAssignmentId,
}: {
  assignments: Assignment[];
  onBreakdown: (assignmentId: string) => void;
  onPlanDirectly: (assignment: Assignment) => void;
  planningAssignmentId: string | null;
}) {
  if (assignments.length === 0) return null;
  return (
    <div className="mb-4 rounded-2xl border border-border bg-card p-4">
      <p className="mb-3 text-sm text-foreground">
        {assignments.length === 1 ? (
          <>
            &ldquo;{assignments[0].title}&rdquo; needs to be broken into steps before it can be
            scheduled &mdash; or, if it&rsquo;s not worth breaking down, plan it as one task.
          </>
        ) : (
          <>
            {assignments.length} assignments need to be broken into steps before they can be
            scheduled &mdash; or plan any of them as one task instead.
          </>
        )}
      </p>
      <BreakdownList
        assignments={assignments}
        onBreakdown={onBreakdown}
        onPlanDirectly={onPlanDirectly}
        planningAssignmentId={planningAssignmentId}
      />
    </div>
  );
}

export default function PlanPage({ user, date, step, onDateChange, onStepChange }: PlanPageProps) {
  const studentId = user.id;
  const today = useMemo(() => todayISODate(), []);

  const [view, setView] = useState<View>({ name: "wizard" });
  const [chosen, setChosen] = useState<Record<string, number>>({});
  const [times, setTimes] = useState<Record<string, string>>({});
  const [showAll, setShowAll] = useState(false);
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [planningAssignmentId, setPlanningAssignmentId] = useState<string | null>(null);
  const [planDirectlyError, setPlanDirectlyError] = useState<string | null>(null);

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

  const loading = activitiesLoading || assignmentsLoading || sessionsLoading;
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
  // here so both the Day step and Select's empty state can point at
  // them directly. docs/features/iterations/daily-planning/
  // daily-planning.i02.md FR-1.
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
  // — used by Select to warn before a student re-schedules something
  // they've already committed elsewhere, rather than leaving that
  // commitment silently invisible. docs/features/iterations/
  // daily-planning/daily-planning.i03.md FR-1. Maps workItemId -> the
  // date it's already planned for.
  const scheduledElsewhere = useMemo(() => {
    const map = new Map<string, string>();
    for (const session of allSessions) {
      if (session.status === "planned" && session.date !== date) {
        map.set(session.workItemId, session.date);
      }
    }
    return map;
  }, [allSessions, date]);

  const capacity = availableMinutes(activities, workSessions, date);
  const commitments = activitiesOn(activities, date);
  const dueThatDay = assignments.filter(
    (assignment) => !assignment.completedAt && assignment.dueDate === date,
  );
  const slots = useMemo(() => studySlots(activities, date), [activities, date]);

  const chosenIds = Object.keys(chosen);
  const planned = chosenIds.reduce((sum, id) => sum + (chosen[id] ?? 0), 0);
  const over = planned > capacity;

  // date/step are lifted (see PlanPageProps above) so they aren't lost
  // if the tab unmounts, but the local selections they depend on
  // (chosen/times) intentionally are not lifted — FR-2 only requires
  // day/step to survive. If a remount restores a mid-flow step with no
  // matching selections, fall back to the Day step rather than render
  // an empty/broken Estimate, Schedule, or Confirm screen.
  const safeStep: Step =
    (step === "estimate" || step === "schedule" || step === "confirm") && chosenIds.length === 0
      ? "day"
      : step;

  function pickDay(nextDate: string) {
    onDateChange(nextDate);
    onStepChange("day");
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

      {loadError && (
        <div role="alert" className={errorBoxStyle}>
          <p className="mb-2">Couldn&rsquo;t load your plan.</p>
          <Button onClick={retry}>Try again</Button>
        </div>
      )}

      {actionError && (
        <p role="alert" className={errorBoxStyle}>
          {actionError}
        </p>
      )}

      {planDirectlyError && (
        <p role="alert" className={errorBoxStyle}>
          {planDirectlyError}
        </p>
      )}

      {!loading && !loadError && (
        <>
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {STEP_LABEL[safeStep]}
          </p>

          {safeStep === "day" ? (
            <section>
              <h2 className="mb-3 text-base font-medium text-foreground">
                Let&rsquo;s plan {dayLabel(date, today)}.
              </h2>

              <BreakdownNotice
                assignments={assignmentsNeedingBreakdown}
                onBreakdown={(assignmentId) => setView({ name: "breakdown", assignmentId })}
                onPlanDirectly={planWithoutBreakdown}
                planningAssignmentId={planningAssignmentId}
              />

              {dueThatDay.length > 0 && (
                <ul className="mb-3 flex flex-col gap-1">
                  {dueThatDay.map((assignment) => (
                    <li key={assignment.id} className="text-sm text-foreground">
                      Due: {assignment.title}{" "}
                      <span className="text-xs text-muted-foreground">
                        {courseName(assignment.courseId)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {commitments.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {commitments.map((activity) => (
                    <li
                      key={activity.id}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm"
                    >
                      <span className="text-foreground">{activity.name}</span>
                      <span className="ml-auto text-muted-foreground">
                        {timeLabel(activity.startTime)}–{timeLabel(activity.finishTime)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nothing else on that day.</p>
              )}

              {workSessions.length > 0 && (
                <>
                  <h3 className="mt-5 mb-2 text-sm font-semibold text-foreground">
                    Already planned
                  </h3>
                  <ul className="flex flex-col gap-1">
                    {workSessions.map((session) => {
                      const item = workItems.find((w) => w.id === session.workItemId);
                      const assignment = item
                        ? assignments.find((a) => a.id === item.assignmentId)
                        : undefined;
                      const done = session.status === "done";
                      return (
                        <li
                          key={session.id}
                          className="flex items-center gap-2 text-sm text-foreground"
                        >
                          {done ? (
                            <Check className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="size-1.5 shrink-0 rounded-full bg-primary"
                            />
                          )}
                          <span className={`min-w-0 flex-1 ${done ? "line-through opacity-60" : ""}`}>
                            <span className="block truncate">{item?.title ?? "Study session"}</span>
                            {item && assignment && (
                              <span className="block truncate text-xs text-muted-foreground">
                                {assignment.title} · {courseName(assignment.courseId)}
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {session.startTime ? `${timeLabel(session.startTime)} · ` : ""}
                            {effortLabel(session.plannedMinutes)}
                          </span>
                          {!done && (
                            <Button
                              aria-label={`Remove ${item?.title ?? "this session"} from ${dayLabel(date, today)}'s plan`}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => removeSession(session.id)}
                            >
                              <X className="size-3.5 text-muted-foreground" />
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              <p className="mt-4 text-sm text-muted-foreground">
                That leaves about{" "}
                <span className="font-medium text-foreground">{effortLabel(Math.max(0, capacity))}</span>{" "}
                of study time.
              </p>
              <Button size="lg" className="mt-6 w-full rounded-2xl" onClick={() => onStepChange("select")}>
                Continue
              </Button>
            </section>
          ) : candidates.length === 0 ? (
            assignmentsNeedingBreakdown.length > 0 ? (
              <section>
                <h2 className="mb-3 text-base font-medium text-foreground">Nothing to plan yet.</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  {assignmentsNeedingBreakdown.length === 1 ? (
                    <>
                      Break &ldquo;{assignmentsNeedingBreakdown[0].title}&rdquo; into steps first,
                      then come back.
                    </>
                  ) : (
                    <>Break these assignments into steps first, then come back.</>
                  )}
                </p>
                <BreakdownList
                  assignments={assignmentsNeedingBreakdown}
                  onBreakdown={(assignmentId) => setView({ name: "breakdown", assignmentId })}
                  onPlanDirectly={planWithoutBreakdown}
                  planningAssignmentId={planningAssignmentId}
                />
                <Button
                  variant="ghost"
                  className="mt-4 rounded-2xl"
                  onClick={() => onStepChange("day")}
                >
                  Back
                </Button>
              </section>
            ) : (
              <EmptyState
                title="Nothing to plan yet."
                hint="Break an assignment into steps first, then come back."
              />
            )
          ) : safeStep === "select" ? (
            <section>
              <h2 className="mb-3 text-base font-medium text-foreground">
                What should you work on?
              </h2>
              <BreakdownNotice
                assignments={assignmentsNeedingBreakdown}
                onBreakdown={(assignmentId) => setView({ name: "breakdown", assignmentId })}
                onPlanDirectly={planWithoutBreakdown}
                planningAssignmentId={planningAssignmentId}
              />
              <ul className="flex flex-col gap-2">
                {visibleCandidates.map(({ assignment, workItem }) => {
                  const selected = workItem.id in chosen;
                  const elsewhereDate = scheduledElsewhere.get(workItem.id);
                  return (
                    <li key={workItem.id}>
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleCandidate(workItem.id, workItem.effortMinutes)}
                        className={`flex min-h-11 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                          selected ? "border-primary bg-accent/60" : "border-border bg-card"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                            selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                          }`}
                        >
                          {selected ? <Check className="size-3" /> : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {workItem.title}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {assignment.title} · {courseName(assignment.courseId)} ·{" "}
                            {dueRelativeLabel(assignment.dueDate, today)}
                          </span>
                          {elsewhereDate && (
                            <span className="mt-1 inline-block truncate rounded-full bg-attention px-2 py-0.5 text-xs font-medium text-attention-foreground">
                              Already planned for {dayLabel(elsewhereDate, today)}
                            </span>
                          )}
                        </span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {effortLabel(workItem.effortMinutes)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {!showAll && candidates.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="mt-3 text-sm text-primary underline underline-offset-4"
                >
                  Show more assignments
                </button>
              )}
              <div className="mt-6 flex gap-2">
                <Button variant="ghost" className="rounded-2xl" onClick={() => onStepChange("day")}>
                  Back
                </Button>
                <Button
                  size="lg"
                  className="flex-1 rounded-2xl"
                  disabled={chosenIds.length === 0}
                  onClick={() => onStepChange("estimate")}
                >
                  Next: estimate time
                </Button>
              </div>
            </section>
          ) : safeStep === "estimate" ? (
            <section>
              <h2 className="mb-3 text-base font-medium text-foreground">
                How long do you think these will take?
              </h2>
              <ul className="flex flex-col gap-2">
                {chosenIds.map((id) => {
                  const entry = candidates.find((c) => c.workItem.id === id);
                  if (!entry) return null;
                  return (
                    <li
                      key={id}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {entry.workItem.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {entry.assignment.title} · {courseName(entry.assignment.courseId)}
                        </span>
                      </span>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label={`Decrease planned time for ${entry.workItem.title}`}
                          onClick={() => adjust(id, -5)}
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-14 text-center text-sm font-medium text-foreground">
                          {effortLabel(chosen[id] ?? 0)}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label={`Increase planned time for ${entry.workItem.title}`}
                          onClick={() => adjust(id, 5)}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-4 text-sm text-muted-foreground">
                Selected: <span className="font-medium text-foreground">{effortLabel(planned)}</span>
                {over ? null : ` · about ${effortLabel(Math.max(0, capacity - planned))} still available`}
              </p>

              {drift !== null && drift > 1.15 && (
                <div className="mt-4 rounded-3xl bg-accent/70 px-5 py-4">
                  <p className="text-sm leading-relaxed text-accent-foreground">
                    Work like this has been taking you about {Math.round((drift - 1) * 100)}% longer
                    than planned. Does that change any of these numbers?
                  </p>
                </div>
              )}

              {over && (
                <div className="mt-4 rounded-3xl bg-attention px-5 py-4 text-sm text-attention-foreground">
                  This is {effortLabel(planned - capacity)} more than you have that day. That is worth
                  knowing now rather than at 10pm.
                </div>
              )}

              <div className="mt-6 flex gap-2">
                <Button variant="ghost" className="rounded-2xl" onClick={() => onStepChange("select")}>
                  Back
                </Button>
                <Button size="lg" className="flex-1 rounded-2xl" onClick={enterSchedule}>
                  Next: when
                </Button>
              </div>
            </section>
          ) : safeStep === "schedule" ? (
            <section>
              <h2 className="mb-3 text-base font-medium text-foreground">When will you do them?</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                These are suggestions. Move anything that does not fit your day.
              </p>
              <ul className="flex flex-col gap-3">
                {chosenIds.map((id) => {
                  const entry = candidates.find((c) => c.workItem.id === id);
                  if (!entry) return null;
                  return (
                    <li key={id} className="rounded-2xl border border-border bg-card px-4 py-3">
                      <div className="flex items-baseline gap-3">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {entry.workItem.title}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {entry.assignment.title} · {courseName(entry.assignment.courseId)}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {effortLabel(chosen[id] ?? 0)}
                        </span>
                      </div>
                      <div
                        role="radiogroup"
                        aria-label={`Time for ${entry.workItem.title}`}
                        className="mt-3 flex flex-wrap items-center gap-2"
                      >
                        {slots.map((slot) => {
                          const active = times[id] === slot.start;
                          return (
                            <button
                              key={slot.start}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => setTimes((prev) => ({ ...prev, [id]: slot.start }))}
                              className={`min-h-11 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                                active
                                  ? "border-primary bg-accent/60 text-foreground"
                                  : "border-border text-muted-foreground"
                              }`}
                            >
                              {slot.label} · {timeLabel(slot.start)}
                            </button>
                          );
                        })}
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>or</span>
                          <input
                            type="time"
                            aria-label={`Choose a custom time for ${entry.workItem.title}`}
                            value={times[id] ?? ""}
                            onChange={(e) =>
                              setTimes((prev) => ({ ...prev, [id]: e.target.value }))
                            }
                            className="h-11 rounded-full border border-border bg-background px-3 text-xs text-foreground"
                          />
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-6 flex gap-2">
                <Button variant="ghost" className="rounded-2xl" onClick={() => onStepChange("estimate")}>
                  Back
                </Button>
                <Button size="lg" className="flex-1 rounded-2xl" onClick={() => onStepChange("confirm")}>
                  Next: review
                </Button>
              </div>
            </section>
          ) : justConfirmed ? (
            <section>
              <h2 className="mb-3 text-base font-medium text-foreground">Plan confirmed.</h2>
              <p className="text-sm text-muted-foreground">
                {effortLabel(planned)} planned for {dayLabel(date, today)}. You can come back
                anytime to adjust it.
              </p>
              <Button
                size="lg"
                className="mt-6 w-full rounded-2xl"
                onClick={() => pickDay(date)}
              >
                Plan another day
              </Button>
            </section>
          ) : (
            <section>
              <h2 className="mb-3 text-base font-medium text-foreground">
                {date === today ? "Today's plan" : `Your plan for ${longPlanDate(date)}`}
              </h2>
              <ol className="flex flex-col gap-2">
                {[...chosenIds]
                  .sort((a, b) => (times[a] ?? "").localeCompare(times[b] ?? ""))
                  .map((id, i) => {
                    const entry = candidates.find((c) => c.workItem.id === id);
                    if (!entry) return null;
                    return (
                      <li
                        key={id}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-foreground">
                            {entry.workItem.title}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {entry.assignment.title} · {courseName(entry.assignment.courseId)}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {times[id] ? `${timeLabel(times[id])} · ` : ""}
                          {effortLabel(chosen[id] ?? 0)}
                        </span>
                      </li>
                    );
                  })}
              </ol>
              <p className="mt-4 text-sm text-muted-foreground">
                {effortLabel(planned)} planned of {effortLabel(Math.max(0, capacity))} available.
              </p>
              <div className="mt-6 flex gap-2">
                <Button variant="ghost" className="rounded-2xl" onClick={() => onStepChange("select")}>
                  Adjust
                </Button>
                <Button size="lg" className="flex-1 rounded-2xl" onClick={finish}>
                  Looks good
                </Button>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
