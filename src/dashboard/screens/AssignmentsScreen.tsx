import { useMemo, useState } from "react";
import { EvidenceLabel, Mono, PageHeader, Panel, Tag } from "../components/shell";
import { courseColorValue } from "../../domain/courseColor";
import { formatDueDate } from "../../domain/dueDate";
import { effortLabel } from "../../domain/effortPresets";
import { remainingMinutes } from "../../domain/remainingMinutes";
import type { DashboardData } from "../hooks/useDashboardData";
import type { DashboardMode } from "../types";

type AssignmentsScreenProps = {
  mode: DashboardMode;
  data: DashboardData;
};

const STATUS_OPTIONS = ["Open", "Complete", "All"] as const;

export default function AssignmentsScreen({ mode, data }: AssignmentsScreenProps) {
  const { courses, assignments, workItems, decompositionAttempts, reflections } = data;
  const [courseId, setCourseId] = useState("All");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("Open");
  const [selectedId, setSelectedId] = useState<string | null>(assignments[0]?.id ?? null);

  const rows = useMemo(
    () =>
      assignments.filter(
        (a) =>
          (courseId === "All" || a.courseId === courseId) &&
          (status === "All" ||
            (status === "Open" && !a.completedAt) ||
            (status === "Complete" && a.completedAt)),
      ),
    [assignments, courseId, status],
  );

  const selected = assignments.find((a) => a.id === selectedId) ?? null;

  return (
    <>
      <PageHeader
        title="Assignments & work"
        description="Every assignment with its work breakdown state. Selecting a row opens the confirmed breakdown, decomposition history, and reflection."
      />

      <Panel className="mb-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Select
            label="Course"
            value={courseId}
            onChange={setCourseId}
            options={[{ value: "All", label: "All" }, ...courses.map((c) => ({ value: c.id, label: c.name }))]}
          />
          <Select
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as (typeof STATUS_OPTIONS)[number])}
            options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
          />
          <span className="ml-auto text-xs text-muted-foreground">{rows.length} assignments</span>
        </div>

        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No assignments match this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="pb-2 font-medium">Assignment</th>
                  <th className="pb-2 font-medium">Course</th>
                  <th className="pb-2 font-medium">Due</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Breakdown</th>
                  <th className="pb-2 font-medium">Effort</th>
                  {mode !== "parent" ? <th className="pb-2 font-medium">Recent reflection</th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const course = courses.find((c) => c.id === a.courseId);
                  const items = workItems.filter((w) => w.assignmentId === a.id);
                  const latestReflection = reflections.find((r) => r.assignmentId === a.id);
                  return (
                    <tr
                      key={a.id}
                      onClick={() => setSelectedId(a.id)}
                      className={`cursor-pointer border-b border-border/60 last:border-0 hover:bg-secondary/50 ${
                        a.id === selectedId ? "bg-secondary/70" : ""
                      }`}
                    >
                      <td className="py-2.5 font-medium text-foreground">
                        <span className="flex items-center gap-2">
                          {course ? (
                            <span
                              aria-hidden="true"
                              className="size-2.5 shrink-0 rounded-full"
                              style={{ background: courseColorValue(course.colorIndex) }}
                            />
                          ) : null}
                          {a.title}
                        </span>
                      </td>
                      <td className="py-2.5 text-muted-foreground">{course?.name ?? "—"}</td>
                      <td className="py-2.5 text-muted-foreground">{formatDueDate(a.dueDate)}</td>
                      <td className="py-2.5 text-muted-foreground">{a.completedAt ? "Complete" : "Open"}</td>
                      <td className="py-2.5">
                        <Tag tone={items.length > 0 ? "positive" : "neutral"}>
                          {items.length > 0 ? `Confirmed · ${items.length} items` : "Not started"}
                        </Tag>
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {effortLabel(a.completedAt ? a.effortMinutes : remainingMinutes(a, items))}
                      </td>
                      {mode !== "parent" ? (
                        <td className="py-2.5 text-muted-foreground">
                          {latestReflection?.structuredResponse ?? "—"}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {selected ? (
        <AssignmentDetail
          assignment={selected}
          course={courses.find((c) => c.id === selected.courseId)}
          items={workItems.filter((w) => w.assignmentId === selected.id)}
          attempts={decompositionAttempts.filter((d) => d.assignmentId === selected.id)}
          assignmentReflections={reflections.filter((r) => r.assignmentId === selected.id)}
          mode={mode}
        />
      ) : null}
    </>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function AssignmentDetail({
  assignment,
  course,
  items,
  attempts,
  assignmentReflections,
  mode,
}: {
  assignment: DashboardData["assignments"][number];
  course: DashboardData["courses"][number] | undefined;
  items: DashboardData["workItems"];
  attempts: DashboardData["decompositionAttempts"];
  assignmentReflections: DashboardData["reflections"];
  mode: DashboardMode;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <Panel
        title={assignment.title}
        subtitle={`${course?.name ?? "No course"} · due ${formatDueDate(assignment.dueDate)} · ${assignment.completedAt ? "Complete" : "Open"}`}
        className="xl:col-span-2"
      >
        <h3 className="mb-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">Confirmed work breakdown</h3>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No confirmed Work Breakdown yet.</p>
        ) : (
          <ol className="space-y-2">
            {items.map((item, i) => (
              <li key={item.id} className="flex items-start gap-3 rounded-lg border border-border px-3 py-2">
                <span className="w-5 text-xs text-muted-foreground">{i + 1}</span>
                <p className={`flex-1 text-sm ${item.completedAt ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {item.title}
                </p>
                <Tag tone={item.completedAt ? "positive" : "neutral"}>{effortLabel(item.effortMinutes)}</Tag>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Adults can view this breakdown. Editing stays with the student.
        </p>
      </Panel>

      <div className="space-y-5">
        {mode !== "parent" ? (
          <Panel title="Decomposition attempt history" actions={<EvidenceLabel kind="observed" />}>
            {attempts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No decomposition attempts recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {attempts.map((attempt) => (
                  <li key={attempt.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {new Date(attempt.occurredAt).toLocaleString()}
                      </p>
                      <Tag tone={attempt.highestScaffoldIntensity === "None" ? "positive" : "evidence"}>
                        Scaffold: {attempt.highestScaffoldIntensity}
                      </Tag>
                    </div>
                    <p className="mt-1.5 text-sm text-foreground">{attempt.outcome}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {attempt.initialWorkItems.length} → {attempt.resultingWorkItems.length} items ·{" "}
                      {attempt.revisionCount} revisions ·{" "}
                      {attempt.assistanceRequested ? "assistance requested" : "no assistance requested"}
                    </p>
                    {mode === "diagnostic" ? (
                      <p className="mt-2">
                        <Mono>{`{"attemptId":"${attempt.id}","scaffold":"${attempt.highestScaffoldIntensity}","revisions":${attempt.revisionCount}}`}</Mono>
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ) : null}

        <Panel title="Student reflection" subtitle="Shown separately from objective evidence.">
          {assignmentReflections.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reflection recorded for this assignment yet.</p>
          ) : (
            <ul className="space-y-4">
              {assignmentReflections.map((reflection) => (
                <li key={reflection.id}>
                  <blockquote className="rounded-lg bg-muted p-3 text-sm italic text-foreground">
                    "{reflection.structuredResponse}"
                  </blockquote>
                  {reflection.freeText && mode !== "parent" ? (
                    <p className="mt-1.5 text-sm italic text-muted-foreground">"{reflection.freeText}"</p>
                  ) : null}
                  {reflection.proposedAdjustment ? (
                    <>
                      <p className="mt-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                        Proposed adjustment
                      </p>
                      <p className="text-sm text-foreground">{reflection.proposedAdjustment}</p>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            This is the student's own account, not a claim about their ability.
          </p>
        </Panel>
      </div>
    </div>
  );
}
