import { useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_EFFORT_MINUTES, EFFORT_PRESETS } from "../domain/effortPresets";
import { tomorrowDateString } from "../domain/dueDate";
import { useCourses } from "../hooks/useCourses";
import { useCreateAssignment } from "../hooks/useCreateAssignment";

type AssignmentCapturePageProps = {
  user: User;
  onCancel: () => void;
  onGoToCourses: () => void;
  onSaved: (assignmentId: string) => void;
};

const errorBoxStyle =
  "mb-4 rounded-lg border border-destructive bg-card p-3 text-sm text-card-foreground";

export default function AssignmentCapturePage({
  user,
  onCancel,
  onGoToCourses,
  onSaved,
}: AssignmentCapturePageProps) {
  const { courses, loading, loadError, retry } = useCourses(user.id);
  const { createAssignment, saving, actionError } = useCreateAssignment(
    user.id,
  );

  const [courseId, setCourseId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(() => tomorrowDateString());
  const [effortMinutes, setEffortMinutes] = useState(DEFAULT_EFFORT_MINUTES);
  const [notes, setNotes] = useState("");

  const canSave = courseId !== null && title.trim() !== "";

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!canSave || courseId === null) return;

    const assignmentId = await createAssignment({
      courseId,
      title,
      dueDate,
      effortMinutes,
      notes,
    });

    if (assignmentId) onSaved(assignmentId);
  }

  return (
    <main className="mx-auto w-full max-w-[420px] p-8">
      <Button variant="ghost" onClick={onCancel} className="mb-3 -ml-3 px-3">
        ← Cancel
      </Button>

      <h1 className="mb-4 text-3xl">New Assignment</h1>

      {loadError && (
        <div role="alert" className={errorBoxStyle}>
          <p className="mb-2">Couldn&rsquo;t load your courses.</p>
          <Button onClick={retry}>Try again</Button>
        </div>
      )}

      {!loading && !loadError && courses.length === 0 && (
        <div className="mb-4">
          <p className="mb-2 text-muted-foreground">
            You don&rsquo;t have any courses yet.
            <br />
            Add one first so you can attach this assignment to it.
          </p>
          <Button onClick={onGoToCourses}>Add a course</Button>
        </div>
      )}

      {courses.length > 0 && (
        <form onSubmit={handleSave}>
          <div className="mb-4">
            <span className="mb-1.5 block text-sm font-medium">Course</span>
            <div
              role="radiogroup"
              aria-label="Course"
              className="flex flex-wrap gap-2"
            >
              {courses.map((course) => (
                <Button
                  key={course.id}
                  type="button"
                  role="radio"
                  aria-checked={courseId === course.id}
                  variant={courseId === course.id ? "default" : "outline"}
                  onClick={() => setCourseId(course.id)}
                >
                  {course.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-1.5">
            <Label htmlFor="assignment-title">What is it?</Label>
            <Input
              id="assignment-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Chapter 7 problem set"
            />
          </div>

          <div className="mb-4 flex flex-col gap-1.5">
            <Label htmlFor="assignment-due-date">Due</Label>
            <Input
              id="assignment-due-date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>

          <div className="mb-4">
            <span className="mb-1.5 block text-sm font-medium">
              How long do you think it will take?
            </span>
            <div
              role="radiogroup"
              aria-label="How long do you think it will take?"
              className="flex flex-wrap gap-2"
            >
              {EFFORT_PRESETS.map((preset) => (
                <Button
                  key={preset.minutes}
                  type="button"
                  role="radio"
                  aria-checked={effortMinutes === preset.minutes}
                  variant={
                    effortMinutes === preset.minutes ? "default" : "outline"
                  }
                  onClick={() => setEffortMinutes(preset.minutes)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              A guess is fine. You will find out how close it was.
            </p>
          </div>

          <div className="mb-4 flex flex-col gap-1.5">
            <Label htmlFor="assignment-notes">Notes (optional)</Label>
            <Textarea
              id="assignment-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          {actionError && (
            <p role="alert" className={errorBoxStyle}>
              {actionError}
            </p>
          )}

          <Button type="submit" disabled={!canSave || saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </form>
      )}
    </main>
  );
}
