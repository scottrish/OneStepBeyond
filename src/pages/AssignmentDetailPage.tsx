import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { courseColorValue } from "../domain/courseColor";
import { EFFORT_PRESETS, effortLabel } from "../domain/effortPresets";
import { formatDueDate } from "../domain/dueDate";
import { todayISODate } from "../domain/planningDate";
import { remainingMinutes } from "../domain/remainingMinutes";
import { assignmentsNeedingAttention } from "../domain/riskDetection";
import { useActivities } from "../hooks/useActivities";
import { useAllWorkSessions } from "../hooks/useAllWorkSessions";
import { useAssignment } from "../hooks/useAssignment";
import { useCourses } from "../hooks/useCourses";
import { usePreferences } from "../hooks/usePreferences";
import { useWorkItems } from "../hooks/useWorkItems";
import ReflectionPrompt from "./ReflectionPrompt";
import WorkBreakdownPage from "./WorkBreakdownPage";

type AssignmentDetailPageProps = {
  user: User;
  assignmentId: string;
  onBack: () => void;
  // Bare tab switch, same pattern HomePage.tsx's own onGoToPlan uses —
  // does not pass this assignment through to Plan (see
  // docs/features/assignment-detail-cta-hierarchy.md's Explicitly Out of
  // Scope, which defers that to home-dashboard-followthrough.md item 4).
  onGoToPlan: () => void;
};

const errorBoxStyle =
  "mb-4 rounded-lg border border-destructive bg-card p-3 text-sm text-card-foreground";

export default function AssignmentDetailPage({
  user,
  assignmentId,
  onBack,
  onGoToPlan,
}: AssignmentDetailPageProps) {
  const {
    assignment,
    loading,
    loadError,
    actionError: assignmentActionError,
    refetch: refetchAssignment,
    updateAssignment,
    deleteAssignment,
    completeAssignment,
  } = useAssignment(assignmentId);
  const { courses } = useCourses(user.id);
  const {
    workItems,
    refetch: refetchWorkItems,
    markAllComplete,
  } = useWorkItems(assignmentId);
  // Only feed docs/features/assignment-detail-cta-hierarchy.md item 2's
  // risk message — kept out of the loading/loadError gate above, which
  // stays scoped to useAssignment alone. The rest of this screen renders
  // from its own already-loaded data regardless of whether this trio has
  // resolved.
  const {
    activities,
    loading: activitiesLoading,
    loadError: activitiesLoadError,
  } = useActivities(user.id);
  const { sessions: allSessions, loading: allSessionsLoading } = useAllWorkSessions(user.id);
  const {
    preferences,
    loading: preferencesLoading,
    loadError: preferencesLoadError,
  } = usePreferences(user.id);
  const today = useMemo(() => todayISODate(), []);

  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [breakingDown, setBreakingDown] = useState(false);
  const [reflecting, setReflecting] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [effortMinutes, setEffortMinutes] = useState(0);
  const [notes, setNotes] = useState("");

  const course = courses.find((c) => c.id === assignment?.courseId);
  const hasCompletedSteps = workItems.some((item) => item.completedAt !== null);
  // Fail closed, not open, on a load error — usePreferences keeps
  // DEFAULT_PREFERENCES even after a failed fetch, so computing anyway
  // would silently use placeholder capacity assumptions and could show a
  // confidently wrong message instead of an honestly absent one. See
  // docs/features/assignment-detail-cta-hierarchy.md item 2.
  const readyForRisk =
    !activitiesLoading && !allSessionsLoading && !preferencesLoading &&
    !activitiesLoadError && !preferencesLoadError;
  const attentionItem =
    assignment && readyForRisk
      ? assignmentsNeedingAttention(
          [assignment],
          workItems,
          allSessions,
          activities,
          today,
          preferences,
        )[0]
      : undefined;
  const suggestBreakdown =
    !!assignment && workItems.length === 0 && assignment.effortMinutes > 45;

  function startEditing() {
    if (!assignment) return;
    setTitle(assignment.title);
    setDueDate(assignment.dueDate);
    setEffortMinutes(assignment.effortMinutes);
    setNotes(assignment.notes ?? "");
    setEditing(true);
  }

  async function handleSaveEdit(event: FormEvent) {
    event.preventDefault();
    if (title.trim() === "") return;
    const succeeded = await updateAssignment({ title, dueDate, effortMinutes, notes });
    if (succeeded) setEditing(false);
  }

  function handleDeleteClick() {
    setConfirmingDelete(true);
  }

  async function handleConfirmDelete() {
    const succeeded = await deleteAssignment();
    if (succeeded) onBack();
  }

  async function handleMarkComplete() {
    const hadWorkItems = workItems.length > 0;
    await Promise.all([completeAssignment(), markAllComplete()]);
    // docs/features/manual-work-breakdown-reflection-v0.1.md §9: "Preferred
    // trigger: Assignment is marked complete and had a Work Breakdown."
    if (hadWorkItems) setReflecting(true);
  }

  if (breakingDown && assignment) {
    return (
      <WorkBreakdownPage
        user={user}
        assignment={assignment}
        confirmedItems={workItems}
        onCancel={() => setBreakingDown(false)}
        onConfirmed={() => {
          setBreakingDown(false);
          refetchAssignment();
          refetchWorkItems();
        }}
      />
    );
  }

  if (reflecting) {
    return (
      <ReflectionPrompt
        studentId={user.id}
        assignmentId={assignmentId}
        onDone={() => setReflecting(false)}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-[420px] p-8">
      <Button variant="ghost" onClick={onBack} className="mb-3 -ml-3 px-3">
        ← Back
      </Button>

      {loading && <p className="text-muted-foreground">Loading…</p>}

      {loadError && (
        <p role="alert" className={errorBoxStyle}>
          Couldn&rsquo;t load this assignment.
        </p>
      )}

      {assignment && confirmingDelete && (
        <div className="rounded-lg border border-destructive bg-card p-4">
          <div className="mb-3 flex flex-col gap-1">
            <p className="text-sm font-medium">Delete this assignment?</p>
            {hasCompletedSteps && (
              <p className="text-sm text-muted-foreground">
                This assignment already has completed steps. Deleting it
                will erase that progress.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setConfirmingDelete(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      )}

      {assignment && editing && (
        <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-title">What is it?</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-due">Due</Label>
            <Input
              id="edit-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-medium">Estimated time</span>
            <div role="radiogroup" aria-label="Estimated time" className="flex flex-wrap gap-2">
              {EFFORT_PRESETS.map((preset) => (
                <Button
                  key={preset.minutes}
                  type="button"
                  role="radio"
                  aria-checked={effortMinutes === preset.minutes}
                  variant={effortMinutes === preset.minutes ? "default" : "outline"}
                  onClick={() => setEffortMinutes(preset.minutes)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-notes">Notes (optional)</Label>
            <Textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {assignmentActionError && (
            <p role="alert" className={errorBoxStyle}>
              {assignmentActionError}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={title.trim() === ""} className="flex-1">
              Save
            </Button>
          </div>
        </form>
      )}

      {assignment && !editing && !confirmingDelete && (
        <>
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {course && (
                <span
                  aria-hidden="true"
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: courseColorValue(course.colorIndex) }}
                />
              )}
              <span className="text-sm text-muted-foreground">{course?.name}</span>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                aria-label="Edit assignment"
                variant="ghost"
                size="icon"
                onClick={startEditing}
              >
                <Pencil className="size-4 text-muted-foreground" />
              </Button>
              <Button
                aria-label="Delete assignment"
                variant="ghost"
                size="icon"
                onClick={handleDeleteClick}
              >
                <Trash2 className="size-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          <h1 className="mb-4 text-3xl">{assignment.title}</h1>

          <dl className="mb-4 flex flex-col gap-3">
            <div>
              <dt className="text-sm text-muted-foreground">Due</dt>
              <dd>{formatDueDate(assignment.dueDate)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                {assignment.completedAt ? "Estimated time" : "Remaining"}
              </dt>
              <dd>
                {assignment.completedAt
                  ? effortLabel(assignment.effortMinutes)
                  : workItems.length > 0
                    ? `${effortLabel(remainingMinutes(assignment, workItems))} of work left · you estimated ${effortLabel(assignment.effortMinutes)} in total`
                    : effortLabel(remainingMinutes(assignment, workItems))}
              </dd>
            </div>
            {assignment.notes && (
              <div>
                <dt className="text-sm text-muted-foreground">Notes</dt>
                <dd className="whitespace-pre-wrap">{assignment.notes}</dd>
              </div>
            )}
          </dl>

          {attentionItem && (
            <div className="mb-4 rounded-3xl bg-attention px-5 py-4">
              <p className="text-sm text-attention-foreground">{attentionItem.message}</p>
            </div>
          )}

          {suggestBreakdown && (
            <div className="mb-4 rounded-3xl border border-border bg-card px-5 py-4">
              <p className="text-sm text-foreground">
                This one is fairly big. Would it help to break it into
                smaller steps? What do you think should happen first?
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3 rounded-xl"
                onClick={() => setBreakingDown(true)}
              >
                Yes, help me start
              </Button>
            </div>
          )}

          <section>
            <h2 className="mb-3 text-sm font-semibold">Steps</h2>

            {workItems.length > 0 && (
              <ul className="mb-3 flex flex-col gap-2">
                {workItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={item.completedAt !== null}
                      disabled
                      aria-label={`${item.title} ${item.completedAt ? "complete" : "not yet complete"}`}
                      className="size-4"
                    />
                    <span
                      className={`flex-1 text-sm ${item.completedAt ? "text-muted-foreground line-through" : ""}`}
                    >
                      {item.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {effortLabel(item.effortMinutes)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <Button variant="outline" onClick={() => setBreakingDown(true)}>
              {workItems.length > 0 ? "Edit breakdown" : "Break this down"}
            </Button>
          </section>

          <div className="mt-8 flex flex-col gap-3">
            <Button size="lg" className="w-full" onClick={onGoToPlan}>
              Plan work for today
            </Button>
            {assignment.completedAt ? (
              <p className="text-center text-sm font-medium text-primary">Completed</p>
            ) : (
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={handleMarkComplete}
              >
                Mark assignment complete
              </Button>
            )}
          </div>
        </>
      )}
    </main>
  );
}
