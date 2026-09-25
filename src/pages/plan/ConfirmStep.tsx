import { Button } from "@/components/ui/button";
import MobileActionBar from "@/components/MobileActionBar";
import { effortLabel } from "../../domain/effortPresets";
import { dayLabel, longPlanDate, timeLabel } from "../../domain/planningDate";
import type { PlanningCandidate } from "../../domain/planningCandidates";

type ConfirmStepProps = {
  justConfirmed: boolean;
  date: string;
  today: string;
  planned: number;
  capacity: number;
  chosenIds: string[];
  times: Record<string, string>;
  chosen: Record<string, number>;
  candidates: PlanningCandidate[];
  courseName: (courseId: string) => string;
  onStartExecution: () => void;
  onPlanAnotherDay: () => void;
  onAdjust: () => void;
  onFinish: () => void;
};

// docs/decisions/20260911-architecture-refactor-proposal.md increment 5
// — Plan's Confirm step (Step 4 of 4), split out of PlanPage.tsx. Covers
// both its review sub-state and its post-confirm acknowledgment
// sub-state (justConfirmed) — the same two states PlanPage itself used
// to branch on, now folded into this one component instead of two
// separate top-level ternary arms.
export default function ConfirmStep({
  justConfirmed,
  date,
  today,
  planned,
  capacity,
  chosenIds,
  times,
  chosen,
  candidates,
  courseName,
  onStartExecution,
  onPlanAnotherDay,
  onAdjust,
  onFinish,
}: ConfirmStepProps) {
  if (justConfirmed) {
    return (
      <section>
        <h2 className="mb-3 text-base font-medium text-foreground">Plan confirmed.</h2>
        <p className="text-sm text-muted-foreground">
          {effortLabel(planned)} planned for {dayLabel(date, today)}. You can come back anytime to
          adjust it.
        </p>
        {date === today && (
          <Button size="lg" className="mt-6 w-full rounded-2xl" onClick={onStartExecution}>
            Start today&rsquo;s plan
          </Button>
        )}
        <Button
          variant={date === today ? "outline" : "default"}
          size="lg"
          className="mt-3 w-full rounded-2xl"
          onClick={onPlanAnotherDay}
        >
          Plan another day
        </Button>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-3 text-base font-medium text-foreground">
        {date === today ? "Today's plan" : `Your plan for ${longPlanDate(date)}`}
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
