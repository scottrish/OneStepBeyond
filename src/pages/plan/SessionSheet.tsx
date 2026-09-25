import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResponsiveSheet from "@/components/ResponsiveSheet";
import { effortLabel } from "../../domain/effortPresets";
import { addDaysISODate, dayLabel, shortDayLabel, timeLabel } from "../../domain/planningDate";
import type { WorkSession } from "../../services/workSessionService";

// Same window as Plan's own day strip (today + next 4 days).
const DAY_STRIP_LENGTH = 5;

type SessionSheetProps = {
  // The session being edited; the sheet is open whenever this is set.
  session: WorkSession | undefined;
  title: string;
  date: string;
  today: string;
  moveTargetDate: string | null;
  moveSubmitting: boolean;
  moveError: string | null;
  moveOverCapacity: boolean;
  moveTargetCapacity: number | null;
  onSetMoveTargetDate: (date: string) => void;
  onConfirmMove: (session: WorkSession) => void;
  onRemove: (session: WorkSession) => void;
  onClose: () => void;
};

// The per-session edit sheet opened from Plan's existing-day view
// (docs/decisions/20260925-existing-day-view.md point 5). Holds Move to
// another day — carried over unchanged from the retired
// AlreadyPlannedList, including its capacity warning (docs/features/
// iterations/daily-planning/daily-planning.i04.md FR-3) — and Remove from
// this day. Roadmap Phase 7 step 10 adds retime and Earlier/Later here.
export default function SessionSheet({
  session,
  title,
  date,
  today,
  moveTargetDate,
  moveSubmitting,
  moveError,
  moveOverCapacity,
  moveTargetCapacity,
  onSetMoveTargetDate,
  onConfirmMove,
  onRemove,
  onClose,
}: SessionSheetProps) {
  const description = session
    ? `${session.startTime ? `${timeLabel(session.startTime)} · ` : ""}${effortLabel(session.plannedMinutes)}`
    : undefined;

  return (
    <ResponsiveSheet
      open={session !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={title}
      {...(description ? { description } : {})}
    >
      {session && (
        <>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Move to another day</h3>
          <div
            role="radiogroup"
            aria-label={`Choose a day to move ${title} to`}
            className="mb-3 flex flex-wrap gap-2"
          >
            {Array.from({ length: DAY_STRIP_LENGTH }, (_, i) => addDaysISODate(today, i))
              .filter((d) => d !== date)
              .map((d) => {
                const active = d === moveTargetDate;
                return (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onSetMoveTargetDate(d)}
                    className={`min-h-11 min-w-11 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-primary bg-accent/60 text-foreground"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {shortDayLabel(d, today)}
                  </button>
                );
              })}
          </div>

          {moveOverCapacity && moveTargetDate && (
            <p className="mb-3 rounded-2xl bg-attention px-3 py-2 text-xs text-attention-foreground">
              This is {effortLabel(session.plannedMinutes - (moveTargetCapacity ?? 0))} more than{" "}
              {dayLabel(moveTargetDate, today)} has. That is worth knowing now rather than at 10pm.
            </p>
          )}

          {moveError && (
            <p role="alert" className="mb-3 text-xs text-destructive">
              {moveError}
            </p>
          )}

          <Button
            className="w-full"
            disabled={!moveTargetDate || moveSubmitting}
            onClick={() => onConfirmMove(session)}
          >
            Move here
          </Button>

          <Button
            variant="destructive"
            className="mt-6 w-full"
            disabled={moveSubmitting}
            onClick={() => onRemove(session)}
          >
            <X aria-hidden="true" /> Remove from this day
          </Button>
        </>
      )}
    </ResponsiveSheet>
  );
}
