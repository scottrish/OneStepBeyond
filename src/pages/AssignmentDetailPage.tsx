import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { courseColorValue } from "../domain/courseColor";
import { DEFAULT_EFFORT_MINUTES, EFFORT_PRESETS, effortLabel } from "../domain/effortPresets";
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
import * as decompositionAttemptService from "../services/decompositionAttemptService";
import type { WorkItem } from "../services/workItemService";
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
    addItem,
    editItem,
    deleteItem,
  } = useWorkItems(user.id, assignmentId);
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

  // docs/features/assignment-detail-cta-hierarchy.md item 3b — inline
  // add/edit/delete replaces WorkBreakdownPage/"Edit breakdown" once at
  // least one Work Item exists. Per item 3a (Correction 5), "Break this
  // down" no longer exists either — WorkBreakdownPage is reachable from
  // this screen only via the breakdown-nudge card's "Yes, help me start"
  // below, for a fresh, large assignment.
  const [addingStep, setAddingStep] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepEffort, setNewStepEffort] = useState(DEFAULT_EFFORT_MINUTES);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editStepTitle, setEditStepTitle] = useState("");
  const [editStepEffort, setEditStepEffort] = useState(DEFAULT_EFFORT_MINUTES);
  const [confirmingDeleteStepId, setConfirmingDeleteStepId] = useState<string | null>(null);

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

  // docs/features/assignment-detail-cta-hierarchy.md item 3b's §5-style
  // effort derivation ("Assignment estimated effort = sum(confirmed Work
  // Item estimated durations)"), reused here the same way
  // confirmWorkBreakdown already applies it for the bulk-replace case.
  async function recomputeAssignmentEffort(updatedItems: WorkItem[]) {
    if (!assignment) return;
    const totalEffortMinutes = updatedItems.reduce((sum, item) => sum + item.effortMinutes, 0);
    await updateAssignment({
      title: assignment.title,
      dueDate: assignment.dueDate,
      effortMinutes: totalEffortMinutes,
      notes: assignment.notes ?? "",
    });
  }

  // Preserves the evidentiary trail docs/decisions/
  // 20260815-manual-work-breakdown-draft-state.md's single-entry-point
  // design existed to guarantee, even though that design's mechanism
  // (WorkBreakdownPage as the only entry point) no longer holds for
  // add/edit. Not called for delete — see item 3b's Functional
  // Requirements for why.
  async function recordStepDecompositionAttempt(
    initialItems: WorkItem[],
    updatedItems: WorkItem[],
  ) {
    await decompositionAttemptService.recordDecompositionAttempt(user.id, {
      assignmentId,
      initialWorkItems: initialItems.map((item) => item.title),
      resultingWorkItems: updatedItems.map((item) => item.title),
      revisionCount: 1,
      outcome: "confirmed",
    });
  }

  async function handleAddStep() {
    const initialItems = workItems;
    const updated = await addItem(newStepTitle.trim(), newStepEffort);
    if (updated) {
      setNewStepTitle("");
      setNewStepEffort(DEFAULT_EFFORT_MINUTES);
      setAddingStep(false);
      await recomputeAssignmentEffort(updated);
      await recordStepDecompositionAttempt(initialItems, updated);
    }
  }

  function startEditingStep(item: WorkItem) {
    setEditingStepId(item.id);
    setEditStepTitle(item.title);
    setEditStepEffort(item.effortMinutes);
  }

  async function handleSaveStepEdit(id: string) {
    const initialItems = workItems;
    const updated = await editItem(id, {
      title: editStepTitle.trim(),
      effortMinutes: editStepEffort,
    });
    if (updated) {
      setEditingStepId(null);
      await recomputeAssignmentEffort(updated);
      await recordStepDecompositionAttempt(initialItems, updated);
    }
  }

  // Deleting an incomplete step is immediate, matching WorkBreakdownPage's
  // own no-confirmation draft delete. A completed step asks first — see
  // handleDeleteStepClick — mirroring the exact reasoning this screen
  // already applies to whole-assignment deletion (hasCompletedSteps).
  async function handleDeleteStep(id: string) {
    const updated = await deleteItem(id);
    if (updated) {
      setConfirmingDeleteStepId(null);
      await recomputeAssignmentEffort(updated);
    }
  }

  function handleDeleteStepClick(item: WorkItem) {
    if (item.completedAt !== null) {
      setConfirmingDeleteStepId(item.id);
    } else {
      handleDeleteStep(item.id);
    }
  }

  // docs/features/assignment-detail-cta-hierarchy.md item 3a (Correction
  // 5) — the understanding prompt on WorkBreakdownPage's create step
  // saves on blur; guarded here too (not just by the prompt not showing
  // in the first place) so a stale/concurrent call can never overwrite
  // notes a student already had.
  async function handleSaveUnderstandingNotes(text: string) {
    if (!assignment || (assignment.notes && assignment.notes.trim() !== "")) return;
    await updateAssignment({
      title: assignment.title,
      dueDate: assignment.dueDate,
      effortMinutes: assignment.effortMinutes,
      notes: text,
    });
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
        showUnderstandingPrompt
        onSaveNotes={handleSaveUnderstandingNotes}
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
                {workItems.map((item) =>
                  editingStepId === item.id ? (
                    <li
                      key={item.id}
                      className="rounded-lg border border-border bg-card p-3"
                    >
                      <Input
                        autoFocus
                        aria-label={`Edit ${item.title}`}
                        value={editStepTitle}
                        onChange={(e) => setEditStepTitle(e.target.value)}
                        className="mb-2"
                      />
                      <div className="mb-3 flex flex-wrap gap-2">
                        {EFFORT_PRESETS.map((preset) => (
                          <Button
                            key={preset.minutes}
                            type="button"
                            size="sm"
                            variant={editStepEffort === preset.minutes ? "default" : "outline"}
                            onClick={() => setEditStepEffort(preset.minutes)}
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingStepId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          disabled={editStepTitle.trim() === ""}
                          onClick={() => handleSaveStepEdit(item.id)}
                        >
                          Save
                        </Button>
                      </div>
                    </li>
                  ) : confirmingDeleteStepId === item.id ? (
                    <li
                      key={item.id}
                      className="rounded-lg border border-destructive bg-card p-3"
                    >
                      <p className="mb-2 text-sm">
                        Delete &ldquo;{item.title}&rdquo;? This step is already
                        complete — deleting it will erase that progress.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={() => setConfirmingDeleteStepId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDeleteStep(item.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  ) : (
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
                      {item.completedAt === null && (
                        <Button
                          aria-label={`Edit ${item.title}`}
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditingStep(item)}
                        >
                          <Pencil className="size-4 text-muted-foreground" />
                        </Button>
                      )}
                      <Button
                        aria-label={`Delete ${item.title}`}
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteStepClick(item)}
                      >
                        <Trash2 className="size-4 text-muted-foreground" />
                      </Button>
                    </li>
                  ),
                )}
              </ul>
            )}

            {addingStep ? (
              <div className="rounded-lg border border-border bg-card p-3">
                <Input
                  autoFocus
                  aria-label="New step title"
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  placeholder="What's the next piece?"
                  className="mb-2"
                />
                <div className="mb-3 flex flex-wrap gap-2">
                  {EFFORT_PRESETS.map((preset) => (
                    <Button
                      key={preset.minutes}
                      type="button"
                      size="sm"
                      variant={newStepEffort === preset.minutes ? "default" : "outline"}
                      onClick={() => setNewStepEffort(preset.minutes)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAddingStep(false);
                      setNewStepTitle("");
                      setNewStepEffort(DEFAULT_EFFORT_MINUTES);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={newStepTitle.trim() === ""}
                    onClick={handleAddStep}
                  >
                    Add
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setAddingStep(true)}>
                  {workItems.length > 0 ? "+ Add another step" : "Just add a step"}
                </Button>
              </div>
            )}
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
