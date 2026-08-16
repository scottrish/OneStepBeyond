import { PageHeader, Panel, Stat, Tag } from "../components/shell";
import { formatDueDate } from "../../domain/dueDate";
import { effortLabel } from "../../domain/effortPresets";
import { remainingMinutes } from "../../domain/remainingMinutes";
import { buildTimelineEvents } from "../domain/timelineEvents";
import type { DashboardData } from "../hooks/useDashboardData";
import type { DashboardMode, DashboardScreen } from "../types";

type OverviewScreenProps = {
  mode: DashboardMode;
  data: DashboardData;
  onNavigate: (screen: DashboardScreen) => void;
};

export default function OverviewScreen({ mode, data, onNavigate }: OverviewScreenProps) {
  return mode === "parent" ? <ParentOverview data={data} /> : <CoachOverview data={data} onNavigate={onNavigate} />;
}

function ParentOverview({ data }: { data: DashboardData }) {
  const upcoming = data.assignments
    .filter((a) => !a.completedAt)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);
  const recentlyCompleted = data.assignments
    .filter((a) => a.completedAt)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="How things are going"
        description="A supportive summary of upcoming work. This is not minute-by-minute monitoring."
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="What's coming up">
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing open right now.</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-foreground">{a.title}</p>
                  <Tag>{formatDueDate(a.dueDate)}</Tag>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent progress">
          {recentlyCompleted.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing completed yet.</p>
          ) : (
            <ul className="space-y-2 text-sm text-foreground">
              {recentlyCompleted.map((a) => (
                <li key={a.id} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent-foreground" />
                  {a.title}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function CoachOverview({
  data,
  onNavigate,
}: {
  data: DashboardData;
  onNavigate: (screen: DashboardScreen) => void;
}) {
  const upcoming = data.assignments.filter((a) => !a.completedAt);
  const estimatedMinutes = upcoming.reduce(
    (sum, a) => sum + remainingMinutes(a, data.workItems.filter((w) => w.assignmentId === a.id)),
    0,
  );
  const recentEvents = buildTimelineEvents(data).slice(0, 5);

  return (
    <>
      <PageHeader
        title="Overview"
        description="Evidence first, interpretation second. Capability is always shown in context — there is no single executive-function score."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Open assignments" value={upcoming.length} />
        <Stat label="Estimated effort remaining" value={effortLabel(estimatedMinutes)} />
        <Stat label="Decomposition attempts" value={data.decompositionAttempts.length} />
        <Stat label="Reflections recorded" value={data.reflections.length} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Current commitments" className="xl:col-span-2">
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open assignments.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="pb-2 font-medium">Assignment</th>
                  <th className="pb-2 font-medium">Due</th>
                  <th className="pb-2 font-medium">Breakdown</th>
                  <th className="pb-2 font-medium">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((a) => {
                  const items = data.workItems.filter((w) => w.assignmentId === a.id);
                  return (
                    <tr key={a.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5">
                        <button
                          type="button"
                          onClick={() => onNavigate("assignments")}
                          className="font-medium text-foreground hover:underline"
                        >
                          {a.title}
                        </button>
                      </td>
                      <td className="py-2.5 text-muted-foreground">{formatDueDate(a.dueDate)}</td>
                      <td className="py-2.5">
                        <Tag tone={items.length > 0 ? "positive" : "neutral"}>
                          {items.length > 0 ? `Confirmed · ${items.length} items` : "Not started"}
                        </Tag>
                      </td>
                      <td className="py-2.5 text-muted-foreground">{effortLabel(remainingMinutes(a, items))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Recent behavior" subtitle="Observed events, newest first.">
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recorded events yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentEvents.map((event) => (
                <li key={event.id} className="flex items-start gap-3">
                  <span className="w-16 shrink-0 pt-0.5 text-xs text-muted-foreground">
                    {new Date(event.occurredAt).toLocaleDateString()}
                  </span>
                  <span className="text-sm text-foreground">{event.description}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => onNavigate("timeline")}
            className="mt-3 text-xs font-medium text-primary hover:underline"
          >
            View full timeline →
          </button>
        </Panel>
      </div>
    </>
  );
}
