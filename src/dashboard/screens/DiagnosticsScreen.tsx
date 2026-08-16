import { Mono, PageHeader, Panel, Stat } from "../components/shell";
import { buildTimelineEvents } from "../domain/timelineEvents";
import type { DashboardData } from "../hooks/useDashboardData";

type DiagnosticsScreenProps = {
  data: DashboardData;
};

// docs/features/coach-parent-dashboard-feature-spec-v0.1.md §17 — entity
// and event inspection only. No "Projection Inspector" / rule-version
// panel: this increment has no derived projections or rule versions to
// show, and §23 explicitly says not to invent them.
export default function DiagnosticsScreen({ data }: DiagnosticsScreenProps) {
  const events = buildTimelineEvents(data);

  return (
    <>
      <PageHeader
        title="Diagnostics"
        description="Test-mode inspection surface. Separate from parent access and never present in the student experience."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Assignments" value={data.assignments.length} />
        <Stat label="Work items" value={data.workItems.length} />
        <Stat label="Decomposition attempts" value={data.decompositionAttempts.length} />
        <Stat label="Reflections" value={data.reflections.length} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Entity index">
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="pb-2 font-medium">ID</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Label</th>
                </tr>
              </thead>
              <tbody>
                {data.assignments.map((a) => (
                  <tr key={a.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2"><Mono>{a.id}</Mono></td>
                    <td className="py-2 text-muted-foreground">Assignment</td>
                    <td className="py-2 text-foreground">{a.title}</td>
                  </tr>
                ))}
                {data.workItems.map((w) => (
                  <tr key={w.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2"><Mono>{w.id}</Mono></td>
                    <td className="py-2 text-muted-foreground">Work Item</td>
                    <td className="py-2 text-foreground">{w.title}</td>
                  </tr>
                ))}
                {data.decompositionAttempts.map((d) => (
                  <tr key={d.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2"><Mono>{d.id}</Mono></td>
                    <td className="py-2 text-muted-foreground">Decomposition Attempt</td>
                    <td className="py-2 text-foreground">{d.outcome}</td>
                  </tr>
                ))}
                {data.reflections.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2"><Mono>{r.id}</Mono></td>
                    <td className="py-2 text-muted-foreground">Reflection</td>
                    <td className="py-2 text-foreground">{r.structuredResponse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Raw event stream" subtitle="Newest events, synthesized from timestamped rows (no dedicated event log table exists yet).">
          <pre className="max-h-[520px] overflow-auto rounded-lg bg-muted p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {JSON.stringify(
              events.map((e) => ({ id: e.id, at: e.occurredAt, type: e.type, assignment: e.assignmentTitle, ...e.payload })),
              null,
              2,
            )}
          </pre>
        </Panel>
      </div>
    </>
  );
}
