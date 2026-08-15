import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { courseColorValue } from "../domain/courseColor";
import { EFFORT_PRESETS } from "../domain/effortPresets";
import { formatDueDate } from "../domain/dueDate";
import { useAssignment } from "../hooks/useAssignment";
import { useCourses } from "../hooks/useCourses";

type AssignmentDetailPageProps = {
  user: User;
  assignmentId: string;
  onBack: () => void;
};

function effortLabel(minutes: number): string {
  return EFFORT_PRESETS.find((preset) => preset.minutes === minutes)?.label
    ?? `${minutes} min`;
}

export default function AssignmentDetailPage({
  user,
  assignmentId,
  onBack,
}: AssignmentDetailPageProps) {
  const { assignment, loading, loadError } = useAssignment(assignmentId);
  const { courses } = useCourses(user.id);

  const course = courses.find((c) => c.id === assignment?.courseId);

  return (
    <main className="mx-auto w-full max-w-[420px] p-8">
      <Button variant="ghost" onClick={onBack} className="mb-3 -ml-3 px-3">
        ← Back
      </Button>

      {loading && <p className="text-muted-foreground">Loading…</p>}

      {loadError && (
        <p
          role="alert"
          className="rounded-lg border border-destructive bg-card p-3 text-sm text-card-foreground"
        >
          Couldn&rsquo;t load this assignment.
        </p>
      )}

      {assignment && (
        <>
          {course && (
            <div className="mb-2 flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: courseColorValue(course.colorIndex) }}
              />
              <span className="text-sm text-muted-foreground">
                {course.name}
              </span>
            </div>
          )}

          <h1 className="mb-4 text-3xl">{assignment.title}</h1>

          <dl className="mb-4 flex flex-col gap-3">
            <div>
              <dt className="text-sm text-muted-foreground">Due</dt>
              <dd>{formatDueDate(assignment.dueDate)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                Estimated time
              </dt>
              <dd>{effortLabel(assignment.effortMinutes)}</dd>
            </div>
            {assignment.notes && (
              <div>
                <dt className="text-sm text-muted-foreground">Notes</dt>
                <dd className="whitespace-pre-wrap">{assignment.notes}</dd>
              </div>
            )}
          </dl>
        </>
      )}
    </main>
  );
}
