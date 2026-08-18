import { useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  // docs/features/assignment-detail-cta-hierarchy.md item 3a (Correction
  // 5) — set only when reached via Assignment Detail's "Yes, help me
  // start"; PlanPage.tsx's own separate entry point into this component
  // omits both, so it's unaffected.
  showUnderstandingPrompt?: boolean;
  onSaveNotes?: (text: string) => Promise<void>;
};

type Step = "create" | "estimate" | "review";
type UnderstandingPromptChoice = "paste" | "own-words";

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
  showUnderstandingPrompt = false,
  onSaveNotes,
}: WorkBreakdownPageProps) {
  const [step, setStep] = useState<Step>("create");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [confirming, setConfirming] = useState(false);
  const {
    draftItems,
    completedItems,
    actionError,
    addItem,
    editItem,
    setEstimate,
    deleteItem,
    moveDraftItem,
    confirm,
  } = useWorkBreakdownDraft(user.id, assignment, confirmedItems);

  // docs/features/assignment-detail-cta-hierarchy.md item 3a — resolved
  // (no draft/confirm ambiguity, unlike Work Items above): notes are
  // either already there, or captured here and saved on blur. Not tied
  // into useWorkBreakdownDraft's own draft state at all.
  const [understandingText, setUnderstandingText] = useState(assignment.notes ?? "");
  const [promptResolved, setPromptResolved] = useState(
    !showUnderstandingPrompt || Boolean(assignment.notes && assignment.notes.trim() !== ""),
  );
  const [understandingChoice, setUnderstandingChoice] =
    useState<UnderstandingPromptChoice | null>(null);
  const [draftUnderstandingText, setDraftUnderstandingText] = useState("");

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

  // Only a non-empty blur resolves the prompt and saves — an empty blur
  // (student tapped away without writing anything) leaves the add-step
  // UI hidden and writes nothing, per this item's Acceptance Criteria.
  async function handleUnderstandingBlur() {
    const text = draftUnderstandingText.trim();
    if (text === "") return;
    setUnderstandingText(text);
    setPromptResolved(true);
    await onSaveNotes?.(text);
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

          {showUnderstandingPrompt && !promptResolved ? (
            <div className="mb-6">
              {understandingChoice === null ? (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setUnderstandingChoice("paste")}
                  >
                    Paste what the teacher said
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setUnderstandingChoice("own-words")}
                  >
                    Say it in my own words
                  </Button>
                </div>
              ) : (
                <>
                  <Label htmlFor="understanding-text" className="sr-only">
                    {understandingChoice === "own-words"
                      ? "What do you have to do?"
                      : "Paste the directions here"}
                  </Label>
                  <Textarea
                    id="understanding-text"
                    autoFocus
                    rows={5}
                    value={draftUnderstandingText}
                    onChange={(event) => setDraftUnderstandingText(event.target.value)}
                    onBlur={handleUnderstandingBlur}
                    placeholder={
                      understandingChoice === "own-words"
                        ? "What do you have to do?"
                        : "Paste the directions here…"
                    }
                    className="mb-2"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUnderstandingChoice(null);
                      setDraftUnderstandingText("");
                    }}
                  >
                    Back
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
              {showUnderstandingPrompt && understandingText && (
                <div className="mb-4 rounded-lg border border-border bg-card p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    What this needs
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{understandingText}</p>
                </div>
              )}

              {completedItems.length > 0 && (
                <ul className="mb-4 flex flex-col gap-2">
                  {completedItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-2"
                    >
                      <input
                        type="checkbox"
                        checked
                        disabled
                        aria-label={`${item.title} complete`}
                        className="size-4"
                      />
                      <span className="flex-1 text-sm text-muted-foreground line-through">
                        {item.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {effortLabel(item.effortMinutes)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

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
            About {effortLabel(totalMinutes)} total for these steps
            {completedItems.length > 0 && " — completed steps aren't shown here"}
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
