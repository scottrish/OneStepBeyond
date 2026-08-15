import { useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { courseColorValue } from "../domain/courseColor";
import { EFFORT_PRESETS } from "../domain/effortPresets";
import { formatDueDate } from "../domain/dueDate";
import { remainingMinutes } from "../domain/remainingMinutes";
import { useAssignment } from "../hooks/useAssignment";
import { useCourses } from "../hooks/useCourses";
import { useWorkItems } from "../hooks/useWorkItems";
import type { Assignment } from "../services/assignmentService";

type AssignmentDetailPageProps = {
  user: User;
  assignmentId: string;
  onBack: () => void;
  // When provided, a delete with no completed steps is handed to the
  // caller (which owns a brief Undo window) instead of being sent to the
  // server immediately. Omitted when this screen is reached somewhere
  // with no list to return an undo affordance to.
  onDeleteImmediate?: (assignment: Assignment) => void;
};

const errorBoxStyle =
  "mb-4 rounded-lg border border-destructive bg-card p-3 text-sm text-card-foreground";

function effortLabel(minutes: number): string {
  return EFFORT_PRESETS.find((preset) => preset.minutes === minutes)?.label
    ?? `${minutes} min`;
}

export default function AssignmentDetailPage({
  user,
  assignmentId,
  onBack,
  onDeleteImmediate,
}: AssignmentDetailPageProps) {
  const {
    assignment,
    loading,
    loadError,
    actionError: assignmentActionError,
    updateAssignment,
    deleteAssignment,
    completeAssignment,
  } = useAssignment(assignmentId);
  const { courses } = useCourses(user.id);
  const {
    workItems,
    actionError: workItemActionError,
    addWorkItem,
    markAllComplete,
  } = useWorkItems(assignmentId, user.id);

  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [addingStep, setAddingStep] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [effortMinutes, setEffortMinutes] = useState(0);
  const [notes, setNotes] = useState("");
  const [stepTitle, setStepTitle] = useState("");
  const [stepEffort, setStepEffort] = useState(15);

  const course = courses.find((c) => c.id === assignment?.courseId);
  const hasCompletedSteps = workItems.some((item) => item.completedAt !== null);

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
    if (hasCompletedSteps) {
      setConfirmingDelete(true);
    } else if (onDeleteImmediate && assignment) {
      onDeleteImmediate(assignment);
      onBack();
    } else {
      deleteAssignment().then((succeeded) => {
        if (succeeded) onBack();
      });
    }
  }

  async function handleConfirmDelete() {
    const succeeded = await deleteAssignment();
    if (succeeded) onBack();
  }

  async function handleAddStep(event: FormEvent) {
    event.preventDefault();
    if (stepTitle.trim() === "") return;
    const succeeded = await addWorkItem(stepTitle, stepEffort);
    if (succeeded) {
      setStepTitle("");
      setAddingStep(false);
    }
  }

  async function handleMarkComplete() {
    await Promise.all([completeAssignment(), markAllComplete()]);
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
          <p className="mb-1 text-sm font-medium">Delete this assignment?</p>
          <p className="mb-3 text-sm text-muted-foreground">
            This assignment already has completed steps. Deleting it will
            erase that progress.
          </p>
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

          {assignment.completedAt ? (
            <p className="mb-4 text-sm font-medium text-primary">Completed</p>
          ) : (
            <Button onClick={handleMarkComplete} className="mb-6 w-full">
              Mark assignment complete
            </Button>
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

            {workItemActionError && (
              <p role="alert" className={errorBoxStyle}>
                {workItemActionError}
              </p>
            )}

            {addingStep ? (
              <form
                onSubmit={handleAddStep}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="step-title">Step</Label>
                  <Input
                    id="step-title"
                    value={stepTitle}
                    onChange={(e) => setStepTitle(e.target.value)}
                    placeholder="Find three sources"
                  />
                </div>
                <div
                  role="radiogroup"
                  aria-label="Step estimated time"
                  className="flex flex-wrap gap-2"
                >
                  {EFFORT_PRESETS.map((preset) => (
                    <Button
                      key={preset.minutes}
                      type="button"
                      role="radio"
                      aria-checked={stepEffort === preset.minutes}
                      variant={stepEffort === preset.minutes ? "default" : "outline"}
                      onClick={() => setStepEffort(preset.minutes)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setAddingStep(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={stepTitle.trim() === ""} className="flex-1">
                    Add step
                  </Button>
                </div>
              </form>
            ) : (
              <Button variant="outline" onClick={() => setAddingStep(true)}>
                Add another step
              </Button>
            )}
          </section>
        </>
      )}
    </main>
  );
}
