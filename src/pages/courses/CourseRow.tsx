import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RowActionsMenu from "@/components/RowActionsMenu";
import SwipeActionRow from "@/components/SwipeActionRow";
import { courseColorValue, courseDeleteWarning } from "../../domain/courseColor";
import type { Course } from "../../services/courseService";
import CourseColorPicker from "./CourseColorPicker";

type CourseRowProps = {
  course: Course;
  // null while the assignment counts aren't known (still loading, or
  // failed) — Delete then can't be confirmed, so the warning is never wrong.
  assignmentCount: number | null;
  editing: boolean;
  confirmingDelete: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (name: string, colorIndex: number) => Promise<boolean>;
  onAskDelete: () => void;
  onKeep: () => void;
  onDelete: () => void;
  deleting: boolean;
};

function countLabel(count: number | null): string {
  if (count === null) return "";
  if (count === 0) return "No assignments";
  return count === 1 ? "1 assignment" : `${count} assignments`;
}

// One course on the Courses screen (course-management-v2-proposal.md
// §1–2): colour dot, name, assignment count, a visible 44px Edit, and
// Delete through swipe or the "More actions" menu at every width. Delete
// never acts directly: it opens the inline confirmation below the row,
// whose warning says plainly that every assignment in the course goes.
export default function CourseRow({
  course,
  assignmentCount,
  editing,
  confirmingDelete,
  onStartEdit,
  onCancelEdit,
  onSave,
  onAskDelete,
  onKeep,
  onDelete,
  deleting,
}: CourseRowProps) {
  const keepRef = useRef<HTMLButtonElement>(null);

  // Keyboard and screen-reader users arrive from the menu; land them on
  // the safe choice. Deferred a tick: the menu's focus trap is still up
  // while this row re-renders (RowActionsMenu's movesFocus stops it
  // taking focus back afterwards).
  useEffect(() => {
    if (!confirmingDelete) return;
    const timer = window.setTimeout(() => keepRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [confirmingDelete]);

  const warning = courseDeleteWarning(course.name, assignmentCount ?? 0);

  return (
    <SwipeActionRow
      id={`course-${course.id}`}
      label={course.name}
      actionLabel="Delete"
      onAction={onAskDelete}
      disabled={editing}
      className="rounded-2xl"
    >
      <div className="rounded-2xl border border-border bg-card py-2 pr-2 pl-4">
        {editing ? (
          <CourseEditForm course={course} onSave={onSave} onCancel={onCancelEdit} />
        ) : (
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="size-3.5 shrink-0 rounded-full"
              style={{ background: courseColorValue(course.colorIndex) }}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">{course.name}</span>
              <span className="block min-h-4 text-xs text-muted-foreground">
                {countLabel(assignmentCount)}
              </span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Edit ${course.name}`}
              className="shrink-0 rounded-full"
              onClick={onStartEdit}
            >
              <Pencil className="size-4 text-muted-foreground" />
            </Button>
            <RowActionsMenu
              label={`More actions for ${course.name}`}
              actions={[
                { label: "Delete", icon: Trash2, onSelect: onAskDelete, destructive: true, movesFocus: true },
              ]}
            />
          </div>
        )}

        {confirmingDelete && !editing && (
          <div
            role="group"
            aria-label={`Delete ${course.name}`}
            className="mt-2 mr-2 mb-1 rounded-xl border border-destructive bg-destructive/10 p-3"
          >
            <p className="flex items-start gap-2 text-sm font-medium text-foreground">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
              {assignmentCount === null ? `Delete ${course.name}?` : warning.title}
            </p>
            {assignmentCount === null ? (
              <p className="mt-1 text-xs text-foreground">
                Couldn’t check which assignments are in this course, so it can’t be deleted right now.
              </p>
            ) : warning.detail ? (
              <p className="mt-1 text-xs text-foreground">{warning.detail}</p>
            ) : null}
            <div className="mt-3 flex gap-2">
              <Button
                variant="destructive"
                disabled={assignmentCount === null || deleting}
                onClick={onDelete}
              >
                Delete
              </Button>
              <Button ref={keepRef} variant="ghost" onClick={onKeep}>
                Keep it
              </Button>
            </div>
          </div>
        )}
      </div>
    </SwipeActionRow>
  );
}

type CourseEditFormProps = {
  course: Course;
  onSave: (name: string, colorIndex: number) => Promise<boolean>;
  onCancel: () => void;
};

// Mounted only while editing, so every edit starts from the saved name and
// colour, and Cancel discards both (docs/decisions/
// 20260925-course-colour-and-delete.md, C2: Save applies both together).
function CourseEditForm({ course, onSave, onCancel }: CourseEditFormProps) {
  const [name, setName] = useState(course.name);
  const [colorIndex, setColorIndex] = useState(course.colorIndex);

  return (
    <form
      className="flex flex-col gap-3 py-2 pr-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (name.trim() !== "") void onSave(name, colorIndex);
      }}
    >
      <Input
        aria-label="Course name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoFocus
      />
      <CourseColorPicker label={`Colour for ${course.name}`} value={colorIndex} onChange={setColorIndex} />
      <div className="flex gap-2">
        <Button type="submit" disabled={name.trim() === ""}>
          Save
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
