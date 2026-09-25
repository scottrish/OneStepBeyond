import { Button } from "@/components/ui/button";
import MobileActionBar from "@/components/MobileActionBar";
import { effortLabel } from "../../domain/effortPresets";
import { longPlanDate, timeLabel } from "../../domain/planningDate";
import type { PlanningCandidate } from "../../domain/planningCandidates";

type ConfirmStepProps = {
  date: string;
  today: string;
  planned: number;
  capacity: number;
  chosenIds: string[];
  times: Record<string, string>;
  chosen: Record<string, number>;
  candidates: PlanningCandidate[];
  courseName: (courseId: string) => string;
  // The day already has a plan, so this confirm *adds* to it (docs/
  // decisions/20260925-confirm-plan-appends.md) — say so, since only the
  // new items are listed here.
  addingToExisting: boolean;
  onAdjust: () => void;
  onFinish: () => void;
};

// docs/decisions/20260911-architecture-refactor-proposal.md increment 5
// — Plan's Confirm step (Step 4 of 4), split out of PlanPage.tsx. Its
// old post-confirm acknowledgment moved to the existing-day view, which
// "Looks good" now lands on (docs/decisions/20260925-existing-day-view.md
// point 4).
export default function ConfirmStep({
  date,
  today,
  planned,
  capacity,
  chosenIds,
  times,
  chosen,
  candidates,
  courseName,
  addingToExisting,
  onAdjust,
  onFinish,
}: ConfirmStepProps) {
  return (
    <section>
      <h2 className="mb-3 text-base font-medium text-foreground">
        {addingToExisting
          ? `Adding to ${date === today ? "today" : longPlanDate(date)}’s plan`
          : date === today
            ? "Today's plan"
            : `Your plan for ${longPlanDate(date)}`}
      </h2>
      <ol className="flex flex-col gap-2">
        {[...chosenIds]
          .sort((a, b) => (times[a] ?? "").localeCompare(times[b] ?? ""))
          .map((id, i) => {
            const entry = candidates.find((c) => c.workItem.id === id);
            if (!entry) return null;
            return (
              <li
                key={id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">
                    {entry.workItem.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {entry.assignment.title} · {courseName(entry.assignment.courseId)}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {times[id] ? `${timeLabel(times[id])} · ` : ""}
                  {effortLabel(chosen[id] ?? 0)}
                </span>
              </li>
            );
          })}
      </ol>
      <p className="mt-4 text-sm text-muted-foreground">
        {effortLabel(planned)} planned of {effortLabel(Math.max(0, capacity))} available.
      </p>
      <MobileActionBar>
        <Button variant="ghost" className="rounded-2xl" onClick={onAdjust}>
          Adjust
        </Button>
        <Button size="lg" className="flex-1 rounded-2xl" onClick={onFinish}>
          Looks good
        </Button>
      </MobileActionBar>
    </section>
  );
}
