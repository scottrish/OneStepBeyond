import { useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { courseColorHex } from "../domain/courseColor";
import { useCourses } from "../hooks/useCourses";

type CoursesPageProps = {
  user: User;
  onBack: () => void;
};

export default function CoursesPage({ user, onBack }: CoursesPageProps) {
  const { courses, loading, addCourse, renameCourse } = useCourses(user.id);
  const [newCourseName, setNewCourseName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (newCourseName.trim() === "") return;
    await addCourse(newCourseName);
    setNewCourseName("");
  }

  function startEditing(id: string, currentName: string) {
    setEditingId(id);
    setEditingName(currentName);
  }

  async function commitEdit() {
    if (editingId && editingName.trim() !== "") {
      await renameCourse(editingId, editingName);
    }
    setEditingId(null);
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
    <main style={{ padding: 32, maxWidth: 420 }}>
      <button
        onClick={onBack}
        style={{
          minHeight: 44,
          minWidth: 44,
          background: "none",
          border: "none",
          color: "var(--text-h)",
          font: "inherit",
          padding: 0,
          marginBottom: 12,
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <h1>Courses</h1>

      {!loading && courses.length === 0 && (
        <p style={{ marginBottom: 16 }}>
          No courses yet.
          <br />
          Add your first class so you can start capturing assignments.
        </p>
      )}

      {courses.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px" }}>
          {courses.map((course) => (
            <li
              key={course.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: courseColorHex(course.colorIndex),
                }}
              />

              {editingId === course.id ? (
                <input
                  aria-label={`Rename ${course.name}`}
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={handleEditKeyDown}
                  autoFocus
                  style={{
                    flex: 1,
                    minHeight: 44,
                    font: "inherit",
                    color: "var(--text-h)",
                  }}
                />
              ) : (
                <button
                  onClick={() => startEditing(course.id, course.name)}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    font: "inherit",
                    color: "var(--text-h)",
                    cursor: "pointer",
                  }}
                >
                  {course.name}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd}>
        <label htmlFor="new-course-name" style={{ display: "block", marginBottom: 4 }}>
          What&rsquo;s it called?
        </label>
        <input
          id="new-course-name"
          value={newCourseName}
          onChange={(event) => setNewCourseName(event.target.value)}
          style={{
            display: "block",
            width: "100%",
            minHeight: 44,
            marginBottom: 8,
            boxSizing: "border-box",
          }}
        />
        <button
          type="submit"
          disabled={newCourseName.trim() === ""}
          style={{ minHeight: 44, minWidth: 44 }}
        >
          Add course
        </button>
      </form>
    </main>
  );
}
