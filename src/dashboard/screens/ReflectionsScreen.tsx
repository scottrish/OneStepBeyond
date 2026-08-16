import { useState } from "react";
import { PageHeader, Panel, Tag } from "../components/shell";
import type { DashboardData } from "../hooks/useDashboardData";
import type { DashboardMode } from "../types";

type ReflectionsScreenProps = {
  mode: DashboardMode;
  data: DashboardData;
};

// docs/features/manual-work-breakdown-reflection-v0.1.md only implements
// the Work Breakdown Reflection moment — every reflection this app
// records has trigger "assignment_completed". No parent-visibility flag
// exists on the reflections table yet, so Parent Mode conservatively
// hides all free text by default, per this spec's §10 ("Do not assume
// every free-text Reflection is parent-visible").
export default function ReflectionsScreen({ mode, data }: ReflectionsScreenProps) {
  const [assignmentId, setAssignmentId] = useState("All");
  const parent = mode === "parent";

  const rows = data.reflections
    .filter((r) => assignmentId === "All" || r.assignmentId === assignmentId)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  const reflectedAssignments = data.assignments.filter((a) =>
    data.reflections.some((r) => r.assignmentId === a.id),
  );

  return (
    <>
      <PageHeader
        title="Reflections"
        description={
          parent
            ? "Reflection themes the student is comfortable sharing. Free-text reflections are not parent-visible by default."
            : "Structured responses, optional free text, and the adjustment the student proposed for next time."
        }
      />

      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Assignment
            <select
              value={assignmentId}
              onChange={(event) => setAssignmentId(event.target.value)}
              className="rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground"
            >
              <option value="All">All</option>
              {reflectedAssignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </label>
          <span className="ml-auto text-xs text-muted-foreground">{rows.length} reflections</span>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No reflections match this filter.
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => {
              const assignment = data.assignments.find((a) => a.id === r.assignmentId);
              return (
                <li key={r.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.occurredAt).toLocaleString()}
                    </span>
                    {assignment ? <Tag tone="evidence">{assignment.title}</Tag> : null}
                  </div>
                  <p className="mt-2 text-sm font-medium text-foreground">{r.structuredResponse}</p>
                  {r.freeText && !parent ? (
                    <p className="mt-1 text-sm italic text-muted-foreground">"{r.freeText}"</p>
                  ) : null}
                  {r.proposedAdjustment ? (
                    <>
                      <p className="mt-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                        Proposed adjustment
                      </p>
                      <p className="text-sm text-foreground">{r.proposedAdjustment}</p>
                    </>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
