import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { effortLabel } from "../../domain/effortPresets";
import type { PlanningCandidate } from "../../domain/planningCandidates";

type EstimateStepProps = {
  chosenIds: string[];
  candidates: PlanningCandidate[];
  chosen: Record<string, number>;
  onAdjust: (itemId: string, delta: number) => void;
  planned: number;
  capacity: number;
  over: boolean;
  drift: number | null;
  courseName: (courseId: string) => string;
  onBack: () => void;
  onNext: () => void;
};

// docs/decisions/20260911-architecture-refactor-proposal.md increment 5
// — Plan's Estimate step (Step 2 of 4), split out of PlanPage.tsx.
export default function EstimateStep({
  chosenIds,
  candidates,
  chosen,
  onAdjust,
  planned,
  capacity,
  over,
  drift,
  courseName,
  onBack,
  onNext,
}: EstimateStepProps) {
  return (
    <section>
      <h2 className="mb-3 text-base font-medium text-foreground">
        How long do you think these will take?
      </h2>
      <ul className="flex flex-col gap-2">
        {chosenIds.map((id) => {
          const entry = candidates.find((c) => c.workItem.id === id);
          if (!entry) return null;
          return (
            <li
              key={id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {entry.workItem.title}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {entry.assignment.title} · {courseName(entry.assignment.courseId)}
                </span>
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`Decrease planned time for ${entry.workItem.title}`}
                  onClick={() => onAdjust(id, -5)}
                >
                  <Minus className="size-3.5" />
                </Button>
                <span className="w-14 text-center text-sm font-medium text-foreground">
                  {effortLabel(chosen[id] ?? 0)}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`Increase planned time for ${entry.workItem.title}`}
                  onClick={() => onAdjust(id, 5)}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-sm text-muted-foreground">
        Selected: <span className="font-medium text-foreground">{effortLabel(planned)}</span>
        {over ? null : ` · about ${effortLabel(Math.max(0, capacity - planned))} still available`}
      </p>

      {drift !== null && drift > 1.15 && (
        <div className="mt-4 rounded-3xl bg-accent/70 px-5 py-4">
          <p className="text-sm leading-relaxed text-accent-foreground">
            Work like this has been taking you about {Math.round((drift - 1) * 100)}% longer than
            planned. Does that change any of these numbers?
          </p>
        </div>
      )}

      {over && (
        <div className="mt-4 rounded-3xl bg-attention px-5 py-4 text-sm text-attention-foreground">
          This is {effortLabel(planned - capacity)} more than you have that day. That is worth
          knowing now rather than at 10pm.
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <Button variant="ghost" className="rounded-2xl" onClick={onBack}>
          Back
        </Button>
        <Button size="lg" className="flex-1 rounded-2xl" onClick={onNext}>
          Next: when
        </Button>
      </div>
    </section>
  );
}
