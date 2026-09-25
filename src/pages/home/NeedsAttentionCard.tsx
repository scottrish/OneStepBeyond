import { Button } from "@/components/ui/button";
import type { AttentionItem } from "../../domain/riskDetection";

const ATTENTION_ACTION_LABEL: Record<AttentionItem["action"], string> = {
  "break-it-down": "Break it down",
  "find-time": "Find time",
  "make-a-plan": "Make a plan",
};

type NeedsAttentionCardProps = {
  attentionItems: AttentionItem[];
  onOpenAssignment: (assignmentId: string) => void;
  // "Find time" and "Make a plan" pass their assignment, so Plan opens
  // with its work already chosen (daily-planning-and-completion-v2-
  // proposal.md item 1).
  onGoToPlan: (assignmentId: string) => void;
};

// docs/decisions/20260912-page-complexity-reduction-proposal.md increment
// 1 — Home's "Needs attention" card, split out of HomePage.tsx.
export default function NeedsAttentionCard({
  attentionItems,
  onOpenAssignment,
  onGoToPlan,
}: NeedsAttentionCardProps) {
  // "At most one item, the most urgent" (home-dashboard.md) —
  // assignmentsNeedingAttention already sorts soonest-due-first.
  const needsAttention = attentionItems[0];
  if (!needsAttention) return null;

  // "Break it down" opens Assignment Detail, the one place for breakdown
  // choices (docs/decisions/20260925-plan-rows-and-one-piece.md, P6 —
  // reversing home-dashboard-followthrough.md item 2). "Find time" and
  // "Make a plan" open Plan with the assignment's work already chosen.
  function act(item: AttentionItem) {
    if (item.action === "break-it-down") onOpenAssignment(item.assignment.id);
    else onGoToPlan(item.assignment.id);
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-1 text-sm font-semibold text-foreground">Needs attention</h2>
      <p className="text-sm text-foreground">
        <button
          type="button"
          onClick={() => onOpenAssignment(needsAttention.assignment.id)}
          // An inline link inside the "{title}: {message}" sentence — WCAG
          // 2.5.5's inline exception, so deliberately not forced to a 44px
          // box, which would break the sentence's line spacing.
          className="underline-offset-4 hover:underline"
        >
          {needsAttention.assignment.title}
        </button>
        : {needsAttention.message}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-3 rounded-2xl"
        onClick={() => act(needsAttention)}
      >
        {ATTENTION_ACTION_LABEL[needsAttention.action]}
      </Button>

      {attentionItems.length > 1 && (
        <ul className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
          {attentionItems.slice(1).map((item) => (
            <li key={item.assignment.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenAssignment(item.assignment.id)}
                className="flex min-h-11 min-w-0 flex-1 items-center truncate text-left text-sm text-foreground underline-offset-4 hover:underline"
              >
                {item.assignment.title}
              </button>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 rounded-2xl"
                onClick={() => act(item)}
              >
                {ATTENTION_ACTION_LABEL[item.action]}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
