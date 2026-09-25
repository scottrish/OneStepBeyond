import { useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import DismissableAlert from "@/components/DismissableAlert";
import ResponsiveSheet from "@/components/ResponsiveSheet";
import { toMinutes } from "../../domain/defaultStartTimes";
import { effortLabel } from "../../domain/effortPresets";
import { addDaysISODate, dayLabel, shortDayLabel, timeLabel } from "../../domain/planningDate";
import type { StudySlot } from "../../domain/studyCapacity";
import type { WorkSession } from "../../services/workSessionService";

// Same window as Plan's own day strip (today + next 4 days).
const DAY_STRIP_LENGTH = 5;

type SessionSheetProps = {
  // The session being edited; the sheet is open whenever this is set.
  session: WorkSession | undefined;
  title: string;
  date: string;
  today: string;
  // Retime: suggested starts from the day's study windows, plus a manual
  // time. isFree says whether a start would clear everything else that day.
  slots: StudySlot[];
  isFree: (session: WorkSession, startTime: string) => boolean;
  retimeError: string | null;
  onDismissRetimeError: () => void;
  onRetime: (session: WorkSession, startTime: string) => void;
  // Earlier / Later: the non-drag reorder (WCAG 2.2 SC 2.5.7).
  canMoveEarlier: boolean;
  canMoveLater: boolean;
  onMove: (session: WorkSession, direction: "up" | "down") => void;
  reorderError: string | null;
  onDismissReorderError: () => void;
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
// this day — and, since roadmap Phase 7 step 10, retime and Earlier/Later
// (docs/decisions/20260925-session-reorder-and-drag.md). Every change
// saves immediately; the sheet stays open to show the result.
export default function SessionSheet({
  session,
  title,
  date,
  today,
  slots,
  isFree,
  retimeError,
  onDismissRetimeError,
  onRetime,
  canMoveEarlier,
  canMoveLater,
  onMove,
  reorderError,
  onDismissReorderError,
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
          <RetimeSection
            // Resets the manual time whenever the session's saved time changes.
            key={`${session.id}-${session.startTime ?? ""}`}
            session={session}
            title={title}
            slots={slots}
            isFree={isFree}
            error={retimeError}
            onDismissError={onDismissRetimeError}
            onRetime={onRetime}
          />

          <h3 className="mb-2 text-sm font-semibold text-foreground">Order</h3>
          <div className="mb-3 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={!canMoveEarlier}
              onClick={() => onMove(session, "up")}
            >
              <ArrowUp aria-hidden="true" /> Earlier
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={!canMoveLater}
              onClick={() => onMove(session, "down")}
            >
              <ArrowDown aria-hidden="true" /> Later
            </Button>
          </div>
          {reorderError && (
            <DismissableAlert message={reorderError} onDismiss={onDismissReorderError} />
          )}

          <h3 className="mt-6 mb-2 text-sm font-semibold text-foreground">Move to another day</h3>
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

type RetimeSectionProps = {
  session: WorkSession;
  title: string;
  slots: StudySlot[];
  isFree: (session: WorkSession, startTime: string) => boolean;
  error: string | null;
  onDismissError: () => void;
  onRetime: (session: WorkSession, startTime: string) => void;
};

// Suggested chips that would overlap something are disabled; a manual
// time that overlaps is refused with the reason (never silently moved).
function RetimeSection({
  session,
  title,
  slots,
  isFree,
  error,
  onDismissError,
  onRetime,
}: RetimeSectionProps) {
  const [manual, setManual] = useState(session.startTime?.slice(0, 5) ?? "");
  const current = session.startTime ? toMinutes(session.startTime) : null;

  return (
    <>
      <h3 className="mb-2 text-sm font-semibold text-foreground">Time</h3>
      {slots.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {slots.map((slot) => {
            const selected = current === toMinutes(slot.start);
            return (
              <button
                key={slot.start}
                type="button"
                aria-pressed={selected}
                disabled={!isFree(session, slot.start)}
                onClick={() => onRetime(session, slot.start)}
                className={`min-h-11 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  selected
                    ? "border-primary bg-accent/60 text-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {slot.label} · {timeLabel(slot.start)}
              </button>
            );
          })}
        </div>
      )}
      <form
        className="mb-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (manual) onRetime(session, manual);
        }}
      >
        <input
          type="time"
          aria-label={`Start time for ${title}`}
          value={manual}
          onChange={(event) => setManual(event.target.value)}
          className="h-11 min-w-0 flex-1 rounded-2xl border border-border bg-background px-3 text-base text-foreground"
        />
        <Button type="submit" variant="outline" disabled={!manual}>
          Set time
        </Button>
      </form>
      {error && <DismissableAlert message={error} onDismiss={onDismissError} />}
      <div className="mb-6" />
    </>
  );
}
