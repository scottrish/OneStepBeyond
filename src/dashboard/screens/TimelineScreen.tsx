import { useState } from "react";
import { Mono, PageHeader, Panel, Tag } from "../components/shell";
import { buildTimelineEvents } from "../domain/timelineEvents";
import type { DashboardData } from "../hooks/useDashboardData";
import type { DashboardMode } from "../types";

type TimelineScreenProps = {
  mode: DashboardMode;
  data: DashboardData;
};

// Not reachable in Parent Mode — DashboardShell's own nav already hides
// this screen there, but guard directly too since screen state could
// otherwise be stale across a mode switch (see docs/features/coach-parent-dashboard-feature-spec-v0.1.md
// §11: "Parent Mode should not expose the raw event stream.").
export default function TimelineScreen({ mode, data }: TimelineScreenProps) {
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  if (mode === "parent") {
    return (
      <>
        <PageHeader title="Evidence timeline" description="Not available in parent mode." />
        <Panel>
          <p className="text-sm text-muted-foreground">
            The raw event stream is intentionally hidden in parent mode. Switch to coach mode for evidence detail.
          </p>
        </Panel>
      </>
    );
  }

  const events = buildTimelineEvents(data).filter(
    (e) =>
      !filter ||
      e.type.toLowerCase().includes(filter.toLowerCase()) ||
      (e.assignmentTitle ?? "").toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Evidence timeline"
        description="What actually happened, newest first. Interpretation lives elsewhere in the dashboard."
      />
      <Panel>
        <label className="mb-4 block">
          <span className="sr-only">Filter by event type or assignment</span>
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter by event type or assignment"
            className="w-full max-w-sm rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </label>

        {events.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No events match this filter.</p>
        ) : (
          <ol className="border-l border-border pl-5">
            {events.map((event) => (
              <li key={event.id} className="relative pb-5 last:pb-0">
                <span className="absolute -left-[25px] top-1.5 size-2.5 rounded-full border-2 border-card bg-primary" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.occurredAt).toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-foreground">{event.type}</span>
                  {event.assignmentTitle ? <Tag tone="evidence">{event.assignmentTitle}</Tag> : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                {mode === "diagnostic" ? (
                  <button
                    type="button"
                    onClick={() => setOpen(open === event.id ? null : event.id)}
                    className="mt-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    {open === event.id ? "Hide payload" : "Inspect payload"}
                  </button>
                ) : null}
                {open === event.id ? (
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-[11px] text-muted-foreground">
                    {JSON.stringify(
                      { eventId: event.id, at: event.occurredAt, type: event.type, ...event.payload },
                      null,
                      2,
                    )}
                  </pre>
                ) : null}
                {mode === "diagnostic" && open !== event.id ? (
                  <p className="mt-1">
                    <Mono>{event.id}</Mono>
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </>
  );
}
