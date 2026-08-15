import { useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { courseColorValue } from "../domain/courseColor";
import { useCourses } from "../hooks/useCourses";

type CoursesPageProps = {
  user: User;
  onBack: () => void;
};

export default function CoursesPage({ user, onBack }: CoursesPageProps) {
  const {
    courses,
    loading,
    loadError,
    actionError,
    retry,
    addCourse,
    renameCourse,
  } = useCourses(user.id);
  const [newCourseName, setNewCourseName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (newCourseName.trim() === "") return;
    const succeeded = await addCourse(newCourseName);
    if (succeeded) setNewCourseName("");
  }

  function startEditing(id: string, currentName: string) {
    setEditingId(id);
    setEditingName(currentName);
  }

  async function commitEdit() {
    if (!editingId) return;
    if (editingName.trim() === "") {
      setEditingId(null);
      return;
    }
    const succeeded = await renameCourse(editingId, editingName);
    if (succeeded) setEditingId(null);
  }

  function handleEditKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitEdit();
    } else if (event.key === "Escape") {
      setEditingId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[420px] p-8">
      <Button variant="ghost" onClick={onBack} className="mb-3 -ml-3 px-3">
        ← Back
      </Button>

      <h1 className="mb-4 text-3xl">Courses</h1>

      {loadError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-destructive bg-card p-3 text-card-foreground"
        >
          <p className="mb-2 text-sm">Couldn&rsquo;t load your courses.</p>
          <Button onClick={retry}>Try again</Button>
        </div>
      )}

      {!loading && !loadError && courses.length === 0 && (
        <p className="mb-4 text-muted-foreground">
          No courses yet.
          <br />
          Add your first class so you can start capturing assignments.
        </p>
      )}

      {courses.length > 0 && (
        <ul className="mb-4 list-none p-0">
          {courses.map((course) => (
            <li
              key={course.id}
              className="flex items-center gap-3 border-b border-border py-1"
            >
              <span
                aria-hidden="true"
                className="h-4 w-4 shrink-0 rounded-full"
                style={{ background: courseColorValue(course.colorIndex) }}
              />

              {editingId === course.id ? (
                <Input
                  aria-label={`Rename ${course.name}`}
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={handleEditKeyDown}
                  autoFocus
                  className="flex-1"
                />
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => startEditing(course.id, course.name)}
                  className="h-11 flex-1 justify-start px-2 font-normal"
                >
                  {course.name}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd}>
        <div className="mb-2 flex flex-col gap-1.5">
          <Label htmlFor="new-course-name">What&rsquo;s it called?</Label>
          <Input
            id="new-course-name"
            value={newCourseName}
            onChange={(event) => setNewCourseName(event.target.value)}
          />
        </div>

        {actionError && (
          <p
            role="alert"
            className="mb-2 rounded-lg border border-destructive bg-card p-3 text-sm text-card-foreground"
          >
            {actionError}
          </p>
        )}

        <Button type="submit" disabled={newCourseName.trim() === ""}>
          Add course
        </Button>
      </form>
    </main>
  );
}
