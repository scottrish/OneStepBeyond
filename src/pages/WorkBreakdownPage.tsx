import { useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EFFORT_PRESETS, effortLabel } from "../domain/effortPresets";
import { useWorkBreakdownDraft } from "../hooks/useWorkBreakdownDraft";
import type { Assignment } from "../services/assignmentService";
import type { WorkItem } from "../services/workItemService";

type WorkBreakdownPageProps = {
  user: User;
  assignment: Assignment;
  confirmedItems: WorkItem[];
  onCancel: () => void;
  onConfirmed: (newItems: WorkItem[]) => void;
};

type Step = "create" | "estimate" | "review";

const errorBoxStyle =
  "mb-4 rounded-lg border border-destructive bg-card p-3 text-sm text-card-foreground";

// docs/features/manual-work-breakdown-reflection-v0.1.md §4 — the
// unassisted 3-step "Break this down" flow: create → estimate → confirm.
// No step here ever suggests, reviews, or generates a step (§4 "Do not").
export default function WorkBreakdownPage({
  user,
  assignment,
  confirmedItems,
  onCancel,
  onConfirmed,
}: WorkBreakdownPageProps) {
  const [step, setStep] = useState<Step>("create");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [confirming, setConfirming] = useState(false);
  const {
    draftItems,
    actionError,
    addItem,
    editItem,
    setEstimate,
    deleteItem,
    moveDraftItem,
    confirm,
  } = useWorkBreakdownDraft(user.id, assignment, confirmedItems);

  function handleAddItem(event: FormEvent) {
    event.preventDefault();
    if (newItemTitle.trim() === "") return;
    addItem(newItemTitle.trim());
    setNewItemTitle("");
  }

  async function handleConfirm() {
    setConfirming(true);
    const created = await confirm();
    setConfirming(false);
    if (created) onConfirmed(created);
  }

  const totalMinutes = draftItems.reduce((sum, item) => sum + item.effortMinutes, 0);

  return (
    <main className="mx-auto w-full max-w-[420px] p-8">
      <Button variant="ghost" onClick={onCancel} className="mb-3 -ml-3 px-3">
        ← Cancel
      </Button>

      {step === "create" && (
        <>
          <h1 className="mb-1 text-2xl">What are the main pieces</h1>
          <p className="mb-6 text-2xl">you&rsquo;ll need to get done?</p>

          {draftItems.length > 0 && (
            <ul className="mb-4 flex flex-col gap-2">
              {draftItems.map((item, index) => (
                <li
                  key={item.key}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card p-2"
                >
                  <Input
                    aria-label={`Step ${index + 1}`}
                    value={item.title}
                    onChange={(event) => editItem(item.key, event.target.value)}
                    className="flex-1"
                  />
                  <div className="flex shrink-0 flex-col">
                    <Button
                      aria-label={`Move ${item.title || `step ${index + 1}`} up`}
                      variant="ghost"
                      size="icon"
                      disabled={index === 0}
                      onClick={() => moveDraftItem(index, "up")}
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      aria-label={`Move ${item.title || `step ${index + 1}`} down`}
                      variant="ghost"
                      size="icon"
                      disabled={index === draftItems.length - 1}
                      onClick={() => moveDraftItem(index, "down")}
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                  </div>
                  <Button
                    aria-label={`Delete ${item.title || `step ${index + 1}`}`}
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteItem(item.key)}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAddItem} className="mb-6 flex gap-2">
            <Label htmlFor="new-item-title" className="sr-only">
              Add a piece
            </Label>
            <Input
              id="new-item-title"
              value={newItemTitle}
              onChange={(event) => setNewItemTitle(event.target.value)}
              placeholder="Questions 1–10"
              className="flex-1"
            />
            <Button type="submit" disabled={newItemTitle.trim() === ""}>
              Add
            </Button>
          </form>

          <Button
            className="w-full"
            disabled={draftItems.length === 0}
            onClick={() => setStep("estimate")}
          >
            Next
          </Button>
        </>
      )}

      {step === "estimate" && (
        <>
          <h1 className="mb-6 text-2xl">How long will each piece take?</h1>

          <ul className="mb-6 flex flex-col gap-4">
            {draftItems.map((item) => (
              <li key={item.key}>
                <p className="mb-2 text-sm font-medium">{item.title}</p>
                <div
                  role="radiogroup"
                  aria-label={`Estimated time for ${item.title}`}
                  className="flex flex-wrap gap-2"
                >
                  {EFFORT_PRESETS.map((preset) => (
                    <Button
                      key={preset.minutes}
                      type="button"
                      role="radio"
                      aria-checked={item.effortMinutes === preset.minutes}
                      variant={item.effortMinutes === preset.minutes ? "default" : "outline"}
                      onClick={() => setEstimate(item.key, preset.minutes)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep("create")}>
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={draftItems.some((item) => item.effortMinutes === 0)}
              onClick={() => setStep("review")}
            >
              Next
            </Button>
          </div>
        </>
      )}

      {step === "review" && (
        <>
          <h1 className="mb-1 text-2xl">Does this look like how</h1>
          <p className="mb-6 text-2xl">you want to tackle it?</p>

          <ul className="mb-4 flex flex-col gap-2">
            {draftItems.map((item) => (
              <li
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2"
              >
                <span className="text-sm">{item.title}</span>
                <span className="text-xs text-muted-foreground">
                  {effortLabel(item.effortMinutes)}
                </span>
              </li>
            ))}
          </ul>

          <p className="mb-6 text-sm text-muted-foreground">
            About {effortLabel(totalMinutes)} total
          </p>

          {actionError && (
            <p role="alert" className={errorBoxStyle}>
              {actionError}
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep("create")}>
              Edit the steps
            </Button>
            <Button className="flex-1" disabled={confirming} onClick={handleConfirm}>
              Looks good
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
