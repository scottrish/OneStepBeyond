import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_EFFORT_MINUTES, EFFORT_PRESETS, effortLabel } from "../domain/effortPresets";
import type { WorkItem, WorkItemEdit } from "../services/workItemService";

type AssignmentDetailStepsProps = {
  workItems: WorkItem[];
  onAdd: (title: string, effortMinutes: number) => Promise<unknown>;
  onEdit: (id: string, patch: WorkItemEdit) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
};

// docs/decisions/20260911-architecture-refactor-proposal.md increment 4
// — the Steps section's own inline add/edit/delete UI
// (docs/features/assignment-detail-cta-hierarchy.md item 3b), split out
// of AssignmentDetailPage.tsx. Owns only this section's own local UI
// state; the effort-rollup/DecompositionAttempt side effects that used
// to live alongside it stay in AssignmentDetailPage, via
// useWorkItemOrchestration — this component just calls onAdd/onEdit/
// onDelete and doesn't know those side effects exist.
export default function AssignmentDetailSteps({
  workItems,
  onAdd,
  onEdit,
  onDelete,
}: AssignmentDetailStepsProps) {
  const [addingStep, setAddingStep] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepEffort, setNewStepEffort] = useState(DEFAULT_EFFORT_MINUTES);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editStepTitle, setEditStepTitle] = useState("");
  const [editStepEffort, setEditStepEffort] = useState(DEFAULT_EFFORT_MINUTES);
  const [confirmingDeleteStepId, setConfirmingDeleteStepId] = useState<string | null>(null);

  async function handleAddStep() {
    const succeeded = await onAdd(newStepTitle.trim(), newStepEffort);
    if (succeeded) {
      setNewStepTitle("");
      setNewStepEffort(DEFAULT_EFFORT_MINUTES);
      setAddingStep(false);
    }
  }

  function startEditingStep(item: WorkItem) {
    setEditingStepId(item.id);
    setEditStepTitle(item.title);
    setEditStepEffort(item.effortMinutes);
  }

  async function handleSaveStepEdit(id: string) {
    const succeeded = await onEdit(id, { title: editStepTitle.trim(), effortMinutes: editStepEffort });
    if (succeeded) setEditingStepId(null);
  }

  // Deleting an incomplete step is immediate, matching WorkBreakdownPage's
  // own no-confirmation draft delete. A completed step asks first — see
  // handleDeleteStepClick — mirroring the exact reasoning
  // AssignmentDetailPage already applies to whole-assignment deletion.
  async function handleDeleteStep(id: string) {
    const succeeded = await onDelete(id);
    if (succeeded) setConfirmingDeleteStepId(null);
  }

  function handleDeleteStepClick(item: WorkItem) {
    if (item.completedAt !== null) {
      setConfirmingDeleteStepId(item.id);
    } else {
      handleDeleteStep(item.id);
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold">Steps</h2>

      {workItems.length > 0 && (
        <ul className="mb-3 flex flex-col gap-2">
          {workItems.map((item) =>
            editingStepId === item.id ? (
              <li key={item.id} className="rounded-lg border border-border bg-card p-3">
                <Input
                  autoFocus
                  aria-label={`Edit ${item.title}`}
                  value={editStepTitle}
                  onChange={(e) => setEditStepTitle(e.target.value)}
                  className="mb-2"
                />
                <div className="mb-3 flex flex-wrap gap-2">
                  {EFFORT_PRESETS.map((preset) => (
                    <Button
                      key={preset.minutes}
                      type="button"
                      size="sm"
                      variant={editStepEffort === preset.minutes ? "default" : "outline"}
                      onClick={() => setEditStepEffort(preset.minutes)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingStepId(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={editStepTitle.trim() === ""}
                    onClick={() => handleSaveStepEdit(item.id)}
                  >
                    Save
                  </Button>
                </div>
              </li>
            ) : confirmingDeleteStepId === item.id ? (
              <li key={item.id} className="rounded-lg border border-destructive bg-card p-3">
                <p className="mb-2 text-sm">
                  Delete &ldquo;{item.title}&rdquo;? This step is already complete — deleting it
                  will erase that progress.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => setConfirmingDeleteStepId(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDeleteStep(item.id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ) : (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={item.completedAt !== null}
                  disabled
                  aria-label={`${item.title} ${item.completedAt ? "complete" : "not yet complete"}`}
                  className="size-4"
                />
                <span
                  className={`flex-1 text-sm ${item.completedAt ? "text-muted-foreground line-through" : ""}`}
                >
                  {item.title}
                </span>
                <span className="text-xs text-muted-foreground">{effortLabel(item.effortMinutes)}</span>
                {item.completedAt === null && (
                  <Button
                    aria-label={`Edit ${item.title}`}
                    variant="ghost"
                    size="icon"
                    onClick={() => startEditingStep(item)}
                  >
                    <Pencil className="size-4 text-muted-foreground" />
                  </Button>
                )}
                <Button
                  aria-label={`Delete ${item.title}`}
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteStepClick(item)}
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </li>
            ),
          )}
        </ul>
      )}

      {addingStep ? (
        <div className="rounded-lg border border-border bg-card p-3">
          <Input
            autoFocus
            aria-label="New step title"
            value={newStepTitle}
            onChange={(e) => setNewStepTitle(e.target.value)}
            placeholder="What's the next piece?"
            className="mb-2"
          />
          <div className="mb-3 flex flex-wrap gap-2">
            {EFFORT_PRESETS.map((preset) => (
              <Button
                key={preset.minutes}
                type="button"
                size="sm"
                variant={newStepEffort === preset.minutes ? "default" : "outline"}
                onClick={() => setNewStepEffort(preset.minutes)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAddingStep(false);
                setNewStepTitle("");
                setNewStepEffort(DEFAULT_EFFORT_MINUTES);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1"
              disabled={newStepTitle.trim() === ""}
              onClick={handleAddStep}
            >
              Add
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setAddingStep(true)}>
            {workItems.length > 0 ? "+ Add another step" : "Just add a step"}
          </Button>
        </div>
      )}
    </section>
  );
}
