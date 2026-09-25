import { useState } from "react";
import { CalendarDays, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { effortLabel } from "../../domain/effortPresets";
import { dayLabel, dueRelativeLabel } from "../../domain/planningDate";
import type { SelectRow } from "../../domain/planningCandidates";

type CandidateRowProps = {
  row: SelectRow;
  date: string;
  today: string;
  courseName: (courseId: string) => string;
  highlighted: boolean;
  // Task rows only.
  selected: boolean;
  minutesOnThisDay: number | undefined;
  elsewhereDate: string | undefined;
  onToggle: () => void;
  // "No steps yet" and "Add another step" open the assignment.
  onOpenAssignment: () => void;
  // "All steps done" → "Mark it complete".
  onFinish: () => void;
};

const ROW_BASE =
  "flex min-h-11 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors";
const HIGHLIGHT = "ring-2 ring-primary/40 ring-offset-1 ring-offset-background";

// One row of Plan's Select list (daily-planning-and-completion-v2-proposal.md
// items 4 and 6): an open step to choose; an assignment with no steps yet,
// which opens Assignment Detail — the one place for breakdown choices
// (docs/decisions/20260925-plan-rows-and-one-piece.md); or an assignment
// whose steps are all done, which asks whether the whole thing is finished.
export default function CandidateRow({
  row,
  date,
  today,
  courseName,
  highlighted,
  selected,
  minutesOnThisDay,
  elsewhereDate,
  onToggle,
  onOpenAssignment,
  onFinish,
}: CandidateRowProps) {
  const [expanded, setExpanded] = useState(false);
  const { assignment } = row;
  const context = `${courseName(assignment.courseId)} · ${dueRelativeLabel(assignment.dueDate, today)}`;
  // The ring isn't the only signal: screen readers hear why this row is first.
  const highlightNote = highlighted ? (
    <span className="sr-only">. The assignment you came to plan.</span>
  ) : null;

  if (row.kind === "noSteps") {
    return (
      <button
        type="button"
        onClick={onOpenAssignment}
        className={`${ROW_BASE} border-border bg-card ${highlighted ? HIGHLIGHT : ""}`}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">{assignment.title}</span>
          <span className="block truncate text-xs text-muted-foreground">
            Not broken into steps yet · {context}
          </span>
          <span className="sr-only">. Opens the assignment.</span>
          {highlightNote}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {effortLabel(assignment.effortMinutes)}
        </span>
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </button>
    );
  }

  if (row.kind === "allDone") {
    const panelId = `all-done-${assignment.id}`;
    return (
      <div className={`rounded-2xl border border-border bg-card ${highlighted ? HIGHLIGHT : ""}`}>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((open) => !open)}
          className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left"
        >
          <Check aria-hidden="true" className="size-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">{assignment.title}</span>
            <span className="block truncate text-xs text-muted-foreground">All steps done · {context}</span>
            {highlightNote}
          </span>
          <ChevronRight
            aria-hidden="true"
            className={`size-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </button>
        {expanded && (
          <div id={panelId} className="px-4 pb-4">
            <p className="text-sm text-foreground">
              Every step here is done. Is the whole assignment finished?
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button className="rounded-2xl sm:flex-1" onClick={onFinish}>
                Mark it complete
              </Button>
              <Button variant="outline" className="rounded-2xl sm:flex-1" onClick={onOpenAssignment}>
                Add another step
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const { workItem } = row;
  // Already has a not-done session on this day: can't be added a second
  // time (docs/decisions/20260925-confirm-plan-appends.md point 3; items
  // 6b/6c). Shown with a dashed border and a note saying why, at full
  // text contrast — not dimmed, since the row still carries information.
  const onThisDay = minutesOnThisDay !== undefined;
  const noteId = `planned-on-day-${workItem.id}`;
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={onThisDay}
      aria-describedby={onThisDay ? noteId : undefined}
      onClick={onToggle}
      className={`${ROW_BASE} disabled:cursor-not-allowed ${
        onThisDay
          ? "border-dashed border-border bg-muted/40"
          : selected
            ? "border-primary bg-accent/60"
            : "border-border bg-card"
      } ${highlighted ? HIGHLIGHT : ""}`}
    >
      <span
        aria-hidden="true"
        className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
        }`}
      >
        {selected ? <Check className="size-3" /> : null}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground">{workItem.title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {assignment.title} · {context}
        </span>
        {highlightNote}
        {onThisDay && (
          <span id={noteId} className="mt-1 flex items-center gap-1 text-xs font-medium text-primary">
            <CalendarDays aria-hidden="true" className="size-3" />
            Planned {date === today ? "today" : "this day"} · {effortLabel(minutesOnThisDay)}
          </span>
        )}
        {elsewhereDate && (
          <span className="mt-1 inline-block truncate rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Also planned for {dayLabel(elsewhereDate, today)}
          </span>
        )}
      </span>
      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
        {effortLabel(workItem.effortMinutes)}
      </span>
    </button>
  );
}
