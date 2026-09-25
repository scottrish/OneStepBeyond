import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import TurnedInReminder from "@/components/TurnedInReminder";
import ErrorBanner from "../components/ErrorBanner";
import { courseColorValue } from "../domain/courseColor";
import { effortLabel } from "../domain/effortPresets";
import { formatDueDate } from "../domain/dueDate";
import { isAssignmentFinishable } from "../domain/planningCandidates";
import { remainingMinutes } from "../domain/remainingMinutes";
import { useAssignment } from "../hooks/useAssignment";
import { useAssignmentRisk } from "../hooks/useAssignmentRisk";
import { useCourses } from "../hooks/useCourses";
import { usePlanAsOnePiece } from "../hooks/usePlanAsOnePiece";
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
  // "Plan work for today": Plan's Select for today, with this
  // assignment's steps that still need time already chosen
  // (home-dashboard-followthrough.md item 4; docs/decisions/
  // 20260925-plan-target.md, P1).
  onGoToPlan: () => void;
  // Opened from Plan (its wizard or Look Ahead): forward exits return to
  // Plan's day (daily-planning-and-completion-v2-proposal.md item 4).
  openedFromPlan: boolean;
  // "Plan it as one piece" made this step: open Plan's Select with it
  // chosen — on Plan's day if opened from Plan, otherwise today.
  onPlanPick: (workItemId: string) => void;
  // A breakdown confirmed while opened from Plan: back to Plan's Select
  // for that day, where the new steps can be chosen.
  onBreakdownConfirmedFromPlan: () => void;
};

// After "complete": the reflection (only if the assignment had steps —
// manual-work-breakdown-reflection-v0.1.md §9), then the turned-in
// reminder, then close (docs/decisions/20260925-plan-rows-and-one-piece.md, P3).
type FinishStage = "reflect" | "reminder" | null;


export default function AssignmentDetailPage({
  user,
  assignmentId,
  onBack,
  onGoToPlan,
  openedFromPlan,
  onPlanPick,
  onBreakdownConfirmedFromPlan,
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
  const [finishStage, setFinishStage] = useState<FinishStage>(null);
  const [addingStep, setAddingStep] = useState(false);
  const {
    planAsOnePiece,
    planning: planningOnePiece,
    error: planOnePieceError,
  } = usePlanAsOnePiece(user.id);

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

  // Every way of completing here ("Mark assignment complete", the all-done
  // card's "Yes, mark it complete") goes the same way: complete, then the
  // reflection if it had steps (§9: "Assignment is marked complete and had
  // a Work Breakdown"), then the turned-in reminder, then close.
  async function finishAssignment() {
    const hadWorkItems = workItems.length > 0;
    const [completed] = await Promise.all([completeAssignment(), markAllComplete()]);
    if (!completed) return;
    setFinishStage(hadWorkItems ? "reflect" : "reminder");
  }

  async function handlePlanAsOnePiece() {
    if (!assignment) return;
    const workItemId = await planAsOnePiece(assignment);
    if (workItemId) onPlanPick(workItemId);
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
          if (openedFromPlan) {
            onBreakdownConfirmedFromPlan();
            return;
          }
          refetchAssignment();
          refetchWorkItems();
        }}
        showUnderstandingPrompt
        onSaveNotes={handleSaveUnderstandingNotes}
      />
    );
  }

  if (finishStage === "reflect") {
    return (
      <ReflectionPrompt
        studentId={user.id}
        assignmentId={assignmentId}
        onDone={() => setFinishStage("reminder")}
      />
    );
  }

  if (finishStage === "reminder" && assignment) {
    return <TurnedInReminder title={assignment.title} onDone={onBack} />;
  }

  const finishable = assignment ? isAssignmentFinishable(assignment, workItems) : false;
  const breakdownActions = (
    <>
      <Button variant="ghost" className="rounded-2xl" onClick={() => setAddingStep(true)}>
        Just add a step
      </Button>
      <Button
        variant="ghost"
        className="rounded-2xl"
        disabled={planningOnePiece}
        onClick={handlePlanAsOnePiece}
      >
        {planningOnePiece ? "Planning…" : "Plan it as one piece"}
      </Button>
    </>
  );

  return (
    <div>
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

          <h1 className="mb-4 text-[clamp(1.65rem,7vw,2.1rem)] leading-tight">{assignment.title}</h1>

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

          {planOnePieceError && <ErrorBanner message={planOnePieceError} className="mb-4" />}

          {/* The one place for breakdown choices (docs/decisions/
              20260925-plan-rows-and-one-piece.md): break it down, add one
              step, or plan it as one piece. */}
          {suggestBreakdown && !addingStep && (
            <div className="mb-4 rounded-3xl border border-border bg-card px-5 py-4">
              <p className="text-sm text-foreground">
                This one is fairly big. Would it help to break it into
                smaller steps? What do you think should happen first?
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="secondary" className="rounded-2xl" onClick={() => setBreakingDown(true)}>
                  Yes, help me start
                </Button>
                {breakdownActions}
              </div>
            </div>
          )}

          <AssignmentDetailSteps
            workItems={workItems}
            onAdd={(title, effortMinutes) => addStep(title, effortMinutes, workItems)}
            onEdit={(id, patch) => editStep(id, patch, workItems)}
            onDelete={(id) => deleteStep(id)}
            adding={addingStep}
            onAddingChange={setAddingStep}
            emptyState={
              <EmptyState
                title="No steps yet."
                hint="Small steps are easier to start than a whole assignment."
                // With the nudge card above, its buttons would repeat
                // these (docs/decisions/20260925-plan-rows-and-one-piece.md, R2).
                action={
                  suggestBreakdown ? undefined : (
                    <div className="flex flex-col items-center gap-2">
                      <Button className="rounded-2xl" onClick={() => setBreakingDown(true)}>
                        Break this down
                      </Button>
                      {breakdownActions}
                    </div>
                  )
                }
              />
            }
            belowList={
              finishable ? (
                <div className="mb-3 rounded-3xl border border-border bg-card px-5 py-4">
                  <p className="text-sm text-foreground">
                    Every step here is done. Is the whole assignment finished?
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Button className="rounded-2xl sm:flex-1" onClick={finishAssignment}>
                      Yes, mark it complete
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-2xl sm:flex-1"
                      onClick={() => setAddingStep(true)}
                    >
                      Not yet — add a step
                    </Button>
                  </div>
                </div>
              ) : null
            }
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
                onClick={finishAssignment}
              >
                Mark assignment complete
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
