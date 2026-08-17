import { useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import EmptyState from "@/components/EmptyState";
import { courseColorValue } from "../domain/courseColor";
import { EFFORT_PRESETS, effortLabel } from "../domain/effortPresets";
import { formatDueDate } from "../domain/dueDate";
import { remainingMinutes } from "../domain/remainingMinutes";
import { useAssignmentsList } from "../hooks/useAssignmentsList";
import { useCourses } from "../hooks/useCourses";
import type { Assignment, AssignmentEdit } from "../services/assignmentService";
import type { WorkItem } from "../services/workItemService";
import type { Course } from "../services/courseService";

type AssignmentsPageProps = {
  user: User;
  onGoToHome: () => void;
  // Assignment Detail is a global overlay owned by App.tsx (see
  // docs/decisions/20260817-assignment-detail-global-overlay.md), not a
  // local view here — tapping a card just requests it open.
  onOpenAssignment: (assignmentId: string) => void;
};

const errorBoxStyle =
  "mb-4 rounded-lg border border-destructive bg-card p-3 text-sm text-card-foreground";

type AssignmentCardProps = {
  assignment: Assignment;
  course: Course | undefined;
  items: WorkItem[];
  onOpen: () => void;
  onEdit: (patch: AssignmentEdit) => Promise<boolean>;
  // Every delete requires this in-card confirmation — deleting is
  // infrequent enough that the extra tap is worth it in exchange for
  // never silently losing something the student didn't mean to delete
  // (see docs/decisions/20260817-remove-undo-delete.md).
  onDeleteConfirmed: () => Promise<boolean>;
};

function AssignmentCard({
  assignment,
  course,
  items,
  onOpen,
  onEdit,
  onDeleteConfirmed,
}: AssignmentCardProps) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [title, setTitle] = useState(assignment.title);
  const [dueDate, setDueDate] = useState(assignment.dueDate);
  const [effortMinutes, setEffortMinutes] = useState(assignment.effortMinutes);
  const [notes, setNotes] = useState(assignment.notes ?? "");

  const structured = items.length > 1;
  const doneCount = items.filter((item) => item.completedAt !== null).length;
  const hasCompletedSteps = doneCount > 0;
  const remaining = remainingMinutes(assignment, items);
  const percentDone = structured ? Math.round((doneCount / items.length) * 100) : 0;

  async function handleSaveEdit(event: FormEvent) {
    event.preventDefault();
    if (title.trim() === "") return;
    const succeeded = await onEdit({ title, dueDate, effortMinutes, notes });
    if (succeeded) setEditing(false);
  }

  function handleDeleteClick() {
    setConfirmingDelete(true);
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSaveEdit}
        className="flex flex-col gap-3 rounded-lg border border-primary/50 bg-card p-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`edit-title-${assignment.id}`}>What is it?</Label>
          <Input
            id={`edit-title-${assignment.id}`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`edit-due-${assignment.id}`}>Due</Label>
          <Input
            id={`edit-due-${assignment.id}`}
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
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
          <Label htmlFor={`edit-notes-${assignment.id}`}>Notes (optional)</Label>
          <Textarea
            id={`edit-notes-${assignment.id}`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={title.trim() === ""} className="flex-1">
            Save
          </Button>
        </div>
      </form>
    );
  }

  if (confirmingDelete) {
    return (
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
          <Button variant="destructive" className="flex-1" onClick={onDeleteConfirmed}>
            Delete
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-center gap-2">
            {course && (
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: courseColorValue(course.colorIndex) }}
              />
            )}
            <span className="text-xs text-muted-foreground">{course?.name}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {formatDueDate(assignment.dueDate)}
            </span>
          </div>
          <p className="mt-2 text-base font-medium">{assignment.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {structured
              ? `${doneCount} of ${items.length} steps complete · about ${effortLabel(remaining)} left`
              : items.length > 0
                ? `About ${effortLabel(remaining)} left of ${effortLabel(assignment.effortMinutes)} planned`
                : `About ${effortLabel(remaining)} left`}
          </p>
          {structured && (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${percentDone}%` }}
              />
            </div>
          )}
        </button>
        <div className="flex shrink-0 flex-col gap-1">
          <Button
            aria-label={`Edit ${assignment.title}`}
            variant="ghost"
            size="icon"
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-3.5 text-muted-foreground" />
          </Button>
          <Button
            aria-label={`Delete ${assignment.title}`}
            variant="ghost"
            size="icon"
            onClick={handleDeleteClick}
          >
            <Trash2 className="size-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AssignmentsPage({
  user,
  onGoToHome,
  onOpenAssignment,
}: AssignmentsPageProps) {
  const {
    assignments,
    workItems,
    loading,
    loadError,
    actionError,
    retry,
    editAssignment,
    removeAssignment,
  } = useAssignmentsList(user.id);
  const { courses } = useCourses(user.id);

  const open = assignments
    .filter((a) => !a.completedAt)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const done = assignments.filter((a) => a.completedAt);

  return (
    <main className="p-8">
      <h1 className="mb-4 text-3xl">Assignments</h1>

      {loadError && (
        <div role="alert" className={errorBoxStyle}>
          <p className="mb-2">Couldn&rsquo;t load your assignments.</p>
          <Button onClick={retry}>Try again</Button>
        </div>
      )}

      {actionError && (
        <p role="alert" className={errorBoxStyle}>
          {actionError}
        </p>
      )}

      {!loading && !loadError && open.length === 0 && done.length === 0 && (
        <EmptyState
          title="No assignments yet."
          hint="Tap + on Home to add your first one."
          action={<Button onClick={onGoToHome}>Go to Home</Button>}
        />
      )}

      {open.length > 0 && (
        <ul className="flex flex-col gap-3">
          {open.map((assignment) => (
            <li key={assignment.id}>
              <AssignmentCard
                assignment={assignment}
                course={courses.find((c) => c.id === assignment.courseId)}
                items={workItems.filter((w) => w.assignmentId === assignment.id)}
                onOpen={() => onOpenAssignment(assignment.id)}
                onEdit={(patch) => editAssignment(assignment.id, patch)}
                onDeleteConfirmed={() => removeAssignment(assignment.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold">Finished</h2>
          <ul className="flex flex-col gap-2">
            {done.map((assignment) => (
              <li key={assignment.id}>
                <button
                  type="button"
                  onClick={() => onOpenAssignment(assignment.id)}
                  className="w-full rounded-lg border border-border bg-muted/40 px-4 py-3 text-left text-sm text-muted-foreground line-through"
                >
                  {assignment.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
