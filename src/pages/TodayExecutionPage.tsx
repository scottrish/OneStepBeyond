import { useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import { effortLabel } from "../domain/effortPresets";
import { todayISODate } from "../domain/planningDate";
import { sortByStartTime } from "../domain/sessionOrder";
import { useAssignmentsList } from "../hooks/useAssignmentsList";
import { useCourses } from "../hooks/useCourses";
import { useReflection } from "../hooks/useReflection";
import { useTodayExecution } from "../hooks/useTodayExecution";
import type { WorkSession } from "../services/workSessionService";

type TodayExecutionPageProps = {
  user: User;
  // "Change today's plan" escape hatch, the empty-state link into
  // Planning, and the all-done screen's own way back — all the same
  // action (docs/features/today-execution.md).
  onBack: () => void;
};

// docs/features/today-execution.md's Reflection section — exactly three
// tap choices, no free text, always skippable. Deliberately not
// ReflectionPrompt.tsx (Work Breakdown Reflection's own component): that
// flow is multi-stage with free text and a follow-up question, which
// this increment's spec explicitly excludes ("No free text, no multi-
// question survey").
const REFLECTION_CHOICES = [
  "Shorter than I thought",
  "About right",
  "Longer than I thought",
] as const;

const errorBoxStyle =
  "mb-4 rounded-lg border border-destructive bg-card p-3 text-sm text-card-foreground";

export default function TodayExecutionPage({ user, onBack }: TodayExecutionPageProps) {
  const studentId = user.id;
  const today = useMemo(() => todayISODate(), []);

  const {
    sessions,
    loading: sessionsLoading,
    loadError: sessionsLoadError,
    actionError,
    retry: retrySessions,
    start,
    complete,
    needMoreTime,
    defer,
  } = useTodayExecution(studentId, today);
  const {
    assignments,
    workItems,
    loading: assignmentsLoading,
    loadError: assignmentsLoadError,
    retry: retryAssignments,
  } = useAssignmentsList(studentId);
  const { courses } = useCourses(studentId);
  const { actionError: reflectionError, submitReflection } = useReflection(studentId);

  const [stuckSessionId, setStuckSessionId] = useState<string | null>(null);
  const [reflectingSessionId, setReflectingSessionId] = useState<string | null>(null);

  const loading = sessionsLoading || assignmentsLoading;
  const loadError = sessionsLoadError ?? assignmentsLoadError;

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

  async function handleDone(session: WorkSession) {
    const succeeded = await complete(session.id);
    if (succeeded) setReflectingSessionId(session.id);
  }

  async function handleReflection(choice: string | null) {
    const session = sessions.find((s) => s.id === reflectingSessionId);
    setReflectingSessionId(null);
    if (!session || choice === null) return;
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

  async function handleMoveToTomorrow(sessionId: string) {
    setStuckSessionId(null);
    await defer(sessionId);
  }

  const reflectingSession = reflectingSessionId
    ? sessions.find((s) => s.id === reflectingSessionId)
    : undefined;

  if (reflectingSession) {
    return (
      <main className="mx-auto w-full max-w-[420px] p-8">
        <h1 className="mb-6 text-2xl">Did this take longer than you expected?</h1>
        <div
          role="radiogroup"
          aria-label="Did this take longer than you expected?"
          className="mb-4 flex flex-col gap-2"
        >
          {REFLECTION_CHOICES.map((choice) => (
            <Button
              key={choice}
              type="button"
              role="radio"
              aria-checked={false}
              variant="outline"
              className="h-11 justify-start"
              onClick={() => handleReflection(choice)}
            >
              {choice}
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          className="text-xs text-muted-foreground"
          onClick={() => handleReflection(null)}
        >
          Skip this question
        </Button>
        {reflectionError && (
          <p role="alert" className={errorBoxStyle}>
            {reflectionError}
          </p>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[420px] p-6">
      <h1 className="mb-1 text-3xl">Today</h1>

      {loadError && (
        <div role="alert" className={errorBoxStyle}>
          <p className="mb-2">Couldn&rsquo;t load today&rsquo;s plan.</p>
          <Button onClick={retry}>Try again</Button>
        </div>
      )}

      {actionError && (
        <p role="alert" className={errorBoxStyle}>
          {actionError}
        </p>
      )}

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
                const stuck = stuckSessionId === current.id;
                return (
                  <>
                    <div className="mb-4 rounded-3xl border border-border bg-card p-5">
                      <p className="text-lg font-medium text-foreground">
                        {item?.title ?? "Study session"}
                      </p>
                      {item && assignment && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {assignment.title} · {courseName(assignment.courseId)}
                        </p>
                      )}
                      <p className="mt-3 text-sm text-muted-foreground">
                        {effortLabel(current.plannedMinutes)}
                      </p>

                      {stuck ? (
                        <div className="mt-4 rounded-2xl bg-accent/70 px-4 py-4">
                          <p className="mb-4 text-sm leading-relaxed text-accent-foreground">
                            Being stuck is information, not failure. What is the smallest piece
                            of this you could still do? Or do you want to move it to tomorrow?
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              className="flex-1 rounded-2xl"
                              onClick={() => handleMoveToTomorrow(current.id)}
                            >
                              Move to tomorrow
                            </Button>
                            <Button
                              className="flex-1 rounded-2xl"
                              onClick={() => setStuckSessionId(null)}
                            >
                              Keep going
                            </Button>
                          </div>
                        </div>
                      ) : current.status === "planned" ? (
                        <Button
                          size="lg"
                          className="mt-4 w-full rounded-2xl"
                          onClick={() => start(current.id)}
                        >
                          Start
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="lg"
                            className="mt-4 w-full rounded-2xl"
                            onClick={() => handleDone(current)}
                          >
                            Done
                          </Button>
                          <div className="mt-2 flex gap-2">
                            <Button
                              variant="ghost"
                              className="flex-1 rounded-2xl text-sm"
                              onClick={() => needMoreTime(current.id)}
                            >
                              Need more time
                            </Button>
                            <Button
                              variant="ghost"
                              className="flex-1 rounded-2xl text-sm"
                              onClick={() => setStuckSessionId(current.id)}
                            >
                              I&rsquo;m stuck
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
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
                          <span className="shrink-0 text-xs">
                            {effortLabel(session.plannedMinutes)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              <Button variant="ghost" className="text-xs text-muted-foreground" onClick={onBack}>
                Change today&rsquo;s plan
              </Button>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
