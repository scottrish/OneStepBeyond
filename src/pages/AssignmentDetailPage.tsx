import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ErrorBanner from "../components/ErrorBanner";
import { courseColorValue } from "../domain/courseColor";
import { effortLabel } from "../domain/effortPresets";
import { formatDueDate } from "../domain/dueDate";
import { remainingMinutes } from "../domain/remainingMinutes";
import { useAssignment } from "../hooks/useAssignment";
import { useAssignmentRisk } from "../hooks/useAssignmentRisk";
import { useCourses } from "../hooks/useCourses";
import { useWorkItemOrchestration } from "../hooks/useWorkItemOrchestration";
import { useWorkItems } from "../hooks/useWorkItems";
import type { AssignmentEdit } from "../services/assignmentService";
import AssignmentDetailDeleteConfirm from "./AssignmentDetailDeleteConfirm";
import AssignmentDetailEditForm from "./AssignmentDetailEditForm";
import AssignmentDetailSteps from "./AssignmentDetailSteps";
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
  const { attentionItem, suggestBreakdown } = useAssignmentRisk(user.id, assignment, workItems);

  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [breakingDown, setBreakingDown] = useState(false);
  const [reflecting, setReflecting] = useState(false);

  // docs/features/assignment-detail-cta-hierarchy.md item 3b — inline
  // add/edit/delete replaces WorkBreakdownPage/"Edit breakdown" once at
  // least one Work Item exists. Per item 3a (Correction 5), "Break this
  // down" no longer exists either — WorkBreakdownPage is reachable from
  // this screen only via the breakdown-nudge card's "Yes, help me start"
  // below, for a fresh, large assignment. The section's own add/edit/
  // delete UI and local state live in AssignmentDetailSteps; the effort-
  // rollup/DecompositionAttempt side effects on top of plain CRUD live in
  // useWorkItemOrchestration below.
  const { addStep, editStep, deleteStep } = useWorkItemOrchestration({
    userId: user.id,
    assignmentId,
    assignment,
    updateAssignment,
    addItem,
    editItem,
    deleteItem,
  });

  const course = courses.find((c) => c.id === assignment?.courseId);
  const hasCompletedSteps = workItems.some((item) => item.completedAt !== null);

  async function handleSaveEdit(patch: AssignmentEdit) {
    const succeeded = await updateAssignment(patch);
    if (succeeded) setEditing(false);
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

      {loadError && <ErrorBanner message="Couldn’t load this assignment." />}

      {assignment && confirmingDelete && (
        <AssignmentDetailDeleteConfirm
          hasCompletedSteps={hasCompletedSteps}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {assignment && editing && (
        <AssignmentDetailEditForm
          assignment={assignment}
          actionError={assignmentActionError}
          onSave={handleSaveEdit}
          onCancel={() => setEditing(false)}
        />
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
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-4 text-muted-foreground" />
              </Button>
              <Button
                aria-label="Delete assignment"
                variant="ghost"
                size="icon"
                onClick={() => setConfirmingDelete(true)}
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

          <AssignmentDetailSteps
            workItems={workItems}
            onAdd={(title, effortMinutes) => addStep(title, effortMinutes, workItems)}
            onEdit={(id, patch) => editStep(id, patch, workItems)}
            onDelete={(id) => deleteStep(id)}
          />

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
