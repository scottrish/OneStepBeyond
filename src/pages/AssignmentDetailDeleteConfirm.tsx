import { Button } from "@/components/ui/button";

type AssignmentDetailDeleteConfirmProps = {
  hasCompletedSteps: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

// docs/decisions/20260912-page-complexity-reduction-proposal.md increment
// 2 — Assignment Detail's whole-assignment delete confirmation, split
// out of AssignmentDetailPage.tsx.
export default function AssignmentDetailDeleteConfirm({
  hasCompletedSteps,
  onCancel,
  onConfirm,
}: AssignmentDetailDeleteConfirmProps) {
  return (
    <div className="rounded-lg border border-destructive bg-card p-4">
      <div className="mb-3 flex flex-col gap-1">
        <p className="text-sm font-medium">Delete this assignment?</p>
        {hasCompletedSteps && (
          <p className="text-sm text-muted-foreground">
            This assignment already has completed steps. Deleting it will erase that progress.
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="destructive" className="flex-1" onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </div>
  );
}
