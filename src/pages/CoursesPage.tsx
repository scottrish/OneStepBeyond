import { useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ErrorBanner from "../components/ErrorBanner";
import { nextCourseColor } from "../domain/courseColor";
import { useAssignmentsList } from "../hooks/useAssignmentsList";
import { useCourses } from "../hooks/useCourses";
import CourseColorPicker from "./courses/CourseColorPicker";
import CourseRow from "./courses/CourseRow";

type CoursesPageProps = {
  user: User;
  onBack: () => void;
};

// docs/features/course-setup.md, extended by course-management-v2-proposal.md:
// add a course with a chosen colour, edit its name and colour, and delete
// it — with everything in it — behind a strong inline warning
// (docs/decisions/20260925-course-colour-and-delete.md).
export default function CoursesPage({ user, onBack }: CoursesPageProps) {
  const { courses, loading, loadError, actionError, retry, addCourse, updateCourse, deleteCourse } =
    useCourses(user.id);
  // For each course's assignment count, and the delete warning's number.
  // Includes completed assignments — they're deleted too.
  const {
    assignments,
    loading: assignmentsLoading,
    loadError: assignmentsLoadError,
    retry: retryAssignments,
  } = useAssignmentsList(user.id);

  const [newCourseName, setNewCourseName] = useState("");
  // null = the default: a colour no existing course uses.
  const [chosenColor, setChosenColor] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const newColor = chosenColor ?? nextCourseColor(courses.map((course) => course.colorIndex));
  const countsKnown = !assignmentsLoading && !assignmentsLoadError;

  function assignmentCount(courseId: string): number | null {
    return countsKnown
      ? assignments.filter((assignment) => assignment.courseId === courseId).length
      : null;
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (newCourseName.trim() === "") return;
    const succeeded = await addCourse(newCourseName, newColor);
    if (succeeded) {
      setNewCourseName("");
      setChosenColor(null);
    }
  }

  async function handleDelete(courseId: string) {
    setDeletingId(courseId);
    const succeeded = await deleteCourse(courseId);
    setDeletingId(null);
    if (succeeded) {
      setConfirmingId(null);
      retryAssignments();
    }
  }

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-3 -ml-3 px-3">
        ← Back
      </Button>

      <h1 className="mb-4 text-[clamp(1.65rem,7vw,2.1rem)] leading-tight">Courses</h1>

      {loadError && <ErrorBanner message="Couldn’t load your courses." onRetry={retry} />}

      {!loading && !loadError && courses.length === 0 && (
        <EmptyState
          title="No courses yet."
          hint="Add your first class so you can start capturing assignments."
        />
      )}

      {courses.length > 0 && (
        <ul className="flex flex-col gap-2">
          {courses.map((course) => (
            <li key={course.id}>
              <CourseRow
                course={course}
                assignmentCount={assignmentCount(course.id)}
                editing={editingId === course.id}
                confirmingDelete={confirmingId === course.id}
                deleting={deletingId === course.id}
                onStartEdit={() => {
                  setEditingId(course.id);
                  setConfirmingId(null);
                }}
                onCancelEdit={() => setEditingId(null)}
                onSave={async (name, colorIndex) => {
                  const succeeded = await updateCourse(course.id, name, colorIndex);
                  if (succeeded) setEditingId(null);
                  return succeeded;
                }}
                onAskDelete={() => {
                  setConfirmingId(course.id);
                  setEditingId(null);
                }}
                onKeep={() => setConfirmingId(null)}
                onDelete={() => void handleDelete(course.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {actionError && <ErrorBanner message={actionError} className="mt-4" />}

      <form
        onSubmit={handleAdd}
        className="mt-8 flex flex-col gap-4 rounded-3xl border border-border bg-card px-5 py-5"
      >
        <h2 className="text-sm font-semibold text-foreground">Add a course</h2>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-course-name">Course name</Label>
          <Input
            id="new-course-name"
            value={newCourseName}
            onChange={(event) => setNewCourseName(event.target.value)}
            placeholder="Chemistry"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Colour</span>
          <CourseColorPicker label="Colour for the new course" value={newColor} onChange={setChosenColor} />
        </div>
        <Button type="submit" size="lg" disabled={newCourseName.trim() === ""}>
          Add course
        </Button>
      </form>
    </div>
  );
}
