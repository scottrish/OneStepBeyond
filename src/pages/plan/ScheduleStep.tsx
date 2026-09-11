import { Button } from "@/components/ui/button";
import { effortLabel } from "../../domain/effortPresets";
import { timeLabel } from "../../domain/planningDate";
import type { PlanningCandidate } from "../../domain/planningCandidates";
import type { StudySlot } from "../../domain/studyCapacity";

type ScheduleStepProps = {
  chosenIds: string[];
  candidates: PlanningCandidate[];
  chosen: Record<string, number>;
  times: Record<string, string>;
  onTimeChange: (itemId: string, value: string) => void;
  slots: StudySlot[];
  courseName: (courseId: string) => string;
  onBack: () => void;
  onNext: () => void;
};

// docs/decisions/20260911-architecture-refactor-proposal.md increment 5
// — Plan's Schedule step (Step 3 of 4), split out of PlanPage.tsx.
export default function ScheduleStep({
  chosenIds,
  candidates,
  chosen,
  times,
  onTimeChange,
  slots,
  courseName,
  onBack,
  onNext,
}: ScheduleStepProps) {
  return (
    <section>
      <h2 className="mb-3 text-base font-medium text-foreground">When will you do them?</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        These are suggestions. Move anything that does not fit your day.
      </p>
      <ul className="flex flex-col gap-3">
        {chosenIds.map((id) => {
          const entry = candidates.find((c) => c.workItem.id === id);
          if (!entry) return null;
          return (
            <li key={id} className="rounded-2xl border border-border bg-card px-4 py-3">
              <div className="flex items-baseline gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {entry.workItem.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {entry.assignment.title} · {courseName(entry.assignment.courseId)}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {effortLabel(chosen[id] ?? 0)}
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <input
                  type="time"
                  aria-label={`Time for ${entry.workItem.title}`}
                  value={times[id] ?? ""}
                  onChange={(e) => onTimeChange(id, e.target.value)}
                  className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
                />
                {slots.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.start}
                        type="button"
                        onClick={() => onTimeChange(id, slot.start)}
                        className="min-h-11 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent/40"
                      >
                        {slot.label} · {timeLabel(slot.start)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-6 flex gap-2">
        <Button variant="ghost" className="rounded-2xl" onClick={onBack}>
          Back
        </Button>
        <Button size="lg" className="flex-1 rounded-2xl" onClick={onNext}>
          Next: review
        </Button>
      </div>
    </section>
  );
}
