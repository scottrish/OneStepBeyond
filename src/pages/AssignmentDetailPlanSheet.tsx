import { Button } from "@/components/ui/button";
import ResponsiveSheet from "@/components/ResponsiveSheet";

const OPTION = "min-h-12 w-full justify-start whitespace-normal rounded-2xl py-3 text-left leading-snug";

// "Plan work for today" on an assignment with no steps
// (docs/features/assignment-detail-no-steps-v0.1.md, N2): planning always
// ends in steps, so it asks how to make them first. For a big assignment
// breaking it down leads; otherwise the two are equal.
export default function AssignmentDetailPlanSheet({
  open,
  big,
  busy,
  onBreakDown,
  onPlanAsOnePiece,
  onClose,
}: {
  open: boolean;
  big: boolean;
  busy: boolean;
  onBreakDown: () => void;
  onPlanAsOnePiece: () => void;
  onClose: () => void;
}) {
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="How do you want to plan this?"
      description={
        big
          ? "This one is fairly big. Smaller steps are easier to plan and start."
          : "Plan it in steps, or as one piece of work."
      }
    >
      <div className="flex flex-col gap-2">
        <Button variant={big ? "default" : "outline"} className={OPTION} onClick={onBreakDown}>
          Break it into steps first
        </Button>
        <Button variant="outline" className={OPTION} disabled={busy} onClick={onPlanAsOnePiece}>
          {busy ? "Planning…" : "Plan it as one piece"}
        </Button>
        <Button variant="ghost" className={OPTION} onClick={onClose}>
          Never mind
        </Button>
      </div>
    </ResponsiveSheet>
  );
}
