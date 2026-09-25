import { ArrowDown, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import DismissableAlert from "@/components/DismissableAlert";
import MobileActionBar from "@/components/MobileActionBar";
import RowActionsMenu from "@/components/RowActionsMenu";
import SortableList from "@/components/SortableList";
import SwipeActionRow from "@/components/SwipeActionRow";
import { effortLabel } from "../../domain/effortPresets";
import { timeLabel } from "../../domain/planningDate";
import type { PlanningCandidate } from "../../domain/planningCandidates";
import { moveItem } from "../../domain/reorder";
import type { StudySlot } from "../../domain/studyCapacity";

type ScheduleStepProps = {
  // The draft items, in their current order.
  order: string[];
  candidates: PlanningCandidate[];
  chosen: Record<string, number>;
  times: Record<string, string>;
  onTimeChange: (itemId: string, value: string) => void;
  // A new draft order (drag or Earlier/Later): times re-chain in memory;
  // nothing is saved until Confirm.
  onReorder: (orderedIds: string[]) => void;
  onRemove: (itemId: string) => void;
  error: string | null;
  onDismissError: () => void;
  slots: StudySlot[];
  courseName: (courseId: string) => string;
  onBack: () => void;
  onNext: () => void;
};

// docs/decisions/20260911-architecture-refactor-proposal.md increment 5
// — Plan's Schedule step (Step 3 of 4), split out of PlanPage.tsx. Its
// rows reorder by drag handle or the row menu's Earlier/Later, and are
// removed by swipe or the menu (docs/decisions/
// 20260925-session-reorder-and-drag.md; mobile-gestures-reorder-and-
// swipe-v0.1.md §1–2).
export default function ScheduleStep({
  order,
  candidates,
  chosen,
  times,
  onTimeChange,
  onReorder,
  onRemove,
  error,
  onDismissError,
  slots,
  courseName,
  onBack,
  onNext,
}: ScheduleStepProps) {
  const entries = order.flatMap((id) => {
    const entry = candidates.find((c) => c.workItem.id === id);
    return entry ? [entry] : [];
  });

  return (
    <section>
      <h2 className="mb-3 text-base font-medium text-foreground">When will you do them?</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        These are suggestions. Move anything that does not fit your day.
      </p>
      {error && <DismissableAlert message={error} onDismiss={onDismissError} />}
      <SortableList
        className="gap-3"
        items={entries}
        getId={(entry) => entry.workItem.id}
        getTitle={(entry) => entry.workItem.title}
        isSortable={() => true}
        onReorder={onReorder}
        renderItem={(entry, lead) => {
          const id = entry.workItem.id;
          const title = entry.workItem.title;
          const index = order.indexOf(id);
          return (
            <SwipeActionRow
              id={`schedule-${id}`}
              label={`${title} from this plan`}
              actionLabel="Remove"
              onAction={() => onRemove(id)}
              className="rounded-2xl"
            >
              <div className="rounded-2xl border border-border bg-card py-2 pr-2 pl-1">
                <div className="flex items-center gap-2">
                  {lead()}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {entry.assignment.title} · {courseName(entry.assignment.courseId)}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {effortLabel(chosen[id] ?? 0)}
                  </span>
                  <RowActionsMenu
                    label={`More actions for ${title}`}
                    actions={[
                      {
                        label: "Earlier",
                        icon: ArrowUp,
                        disabled: index <= 0,
                        onSelect: () => onReorder(moveItem(order, index, "up")),
                      },
                      {
                        label: "Later",
                        icon: ArrowDown,
                        disabled: index >= order.length - 1,
                        onSelect: () => onReorder(moveItem(order, index, "down")),
                      },
                      { label: "Remove", icon: X, onSelect: () => onRemove(id), destructive: true },
                    ]}
                  />
                </div>
                <div className="mt-2 flex flex-col gap-2 pl-3">
                  <input
                    type="time"
                    aria-label={`Time for ${title}`}
                    value={times[id] ?? ""}
                    onChange={(e) => onTimeChange(id, e.target.value)}
                    className="h-12 w-full rounded-2xl border border-border bg-background px-3 text-base text-foreground sm:h-11"
                  />
                  {slots.length > 0 && (
                    // One horizontally scrollable row instead of wrapping, so a
                    // long list of suggestions doesn't push the next item off
                    // screen — docs/features/mobile-app-shell-and-touch-ergonomics-v0.1.md §4.
                    // data-no-swipe: sideways movement here scrolls the chips.
                    <div data-no-swipe className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                      {slots.map((slot) => (
                        <button
                          key={slot.start}
                          type="button"
                          onClick={() => onTimeChange(id, slot.start)}
                          className="min-h-11 shrink-0 whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent/40"
                        >
                          {slot.label} · {timeLabel(slot.start)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </SwipeActionRow>
          );
        }}
      />
      <MobileActionBar>
        <Button variant="ghost" className="rounded-2xl" onClick={onBack}>
          Back
        </Button>
        <Button size="lg" className="flex-1 rounded-2xl" onClick={onNext} disabled={order.length === 0}>
          Next: review
        </Button>
      </MobileActionBar>
    </section>
  );
}
