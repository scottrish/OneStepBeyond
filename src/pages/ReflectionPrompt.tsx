import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useReflection } from "../hooks/useReflection";

type ReflectionPromptProps = {
  studentId: string;
  assignmentId: string;
  onDone: () => void;
};

const PRIMARY_CHOICES = [
  "The steps were about right",
  "Some steps were too big",
  "I missed a step",
  "I made too many steps",
  "Not sure",
  "Something else",
] as const;

const ADJUSTMENT_CHOICES = [
  "Make smaller steps",
  "Make fewer steps",
  "Add a step I missed",
  "Start earlier",
  "Nothing",
  "Something else",
] as const;

type Stage = "primary" | "primary-free-text" | "adjustment" | "adjustment-free-text";

// docs/features/manual-work-breakdown-reflection-v0.1.md §9-12 — one
// question at a time, structured-first, always skippable (never a forced
// journaling requirement), per Design-Principles.md's Eleventh Principle.
export default function ReflectionPrompt({
  studentId,
  assignmentId,
  onDone,
}: ReflectionPromptProps) {
  const [stage, setStage] = useState<Stage>("primary");
  const [structuredResponse, setStructuredResponse] = useState("");
  const [freeText, setFreeText] = useState("");
  const [proposedAdjustment, setProposedAdjustment] = useState<string | null>(null);
  const [adjustmentFreeText, setAdjustmentFreeText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { actionError, submitReflection } = useReflection(studentId);

  // Takes the primary response explicitly rather than reading it from
  // state — handlePrimaryChoice's "about right" branch calls this in the
  // same event handler as setStructuredResponse, before that state
  // update has been applied to this render's closure.
  async function finish(
    finalStructuredResponse: string,
    finalAdjustment: string | null,
    finalAdjustmentFreeText: string,
  ) {
    setSubmitting(true);
    const succeeded = await submitReflection({
      assignmentId,
      trigger: "assignment_completed",
      structuredResponse: finalStructuredResponse,
      freeText: freeText.trim() === "" ? null : freeText.trim(),
      proposedAdjustment:
        finalAdjustment === "Something else"
          ? (finalAdjustmentFreeText.trim() === "" ? null : finalAdjustmentFreeText.trim())
          : finalAdjustment,
    });
    setSubmitting(false);
    if (succeeded) onDone();
  }

  function handlePrimaryChoice(choice: string) {
    setStructuredResponse(choice);
    if (choice === "Something else") {
      setStage("primary-free-text");
    } else if (choice === "The steps were about right") {
      finish(choice, null, "");
    } else {
      setStage("adjustment");
    }
  }

  function handleAdjustmentChoice(choice: string) {
    setProposedAdjustment(choice);
    if (choice === "Something else") {
      setStage("adjustment-free-text");
    } else {
      finish(structuredResponse, choice, "");
    }
  }

  return (
    <main className="mx-auto w-full max-w-[420px] p-8">
      {(stage === "primary" || stage === "primary-free-text") && (
        <>
          <h1 className="mb-6 text-2xl">Did the way you broke this down work?</h1>

          <div role="radiogroup" aria-label="Did the way you broke this down work?" className="mb-4 flex flex-col gap-2">
            {PRIMARY_CHOICES.map((choice) => (
              <Button
                key={choice}
                type="button"
                role="radio"
                aria-checked={structuredResponse === choice}
                variant={structuredResponse === choice ? "default" : "outline"}
                className="h-11 justify-start"
                onClick={() => handlePrimaryChoice(choice)}
              >
                {choice}
              </Button>
            ))}
          </div>

          {stage === "primary-free-text" && (
            <>
              <Textarea
                aria-label="Tell us more (optional)"
                placeholder="Optional — anything you want to add?"
                value={freeText}
                onChange={(event) => setFreeText(event.target.value)}
                className="mb-4"
              />
              <Button disabled={submitting} onClick={() => setStage("adjustment")}>
                Continue
              </Button>
            </>
          )}

          {stage === "primary" && (
            <Button variant="ghost" className="text-xs text-muted-foreground" onClick={onDone}>
              Skip this question
            </Button>
          )}
        </>
      )}

      {(stage === "adjustment" || stage === "adjustment-free-text") && (
        <>
          <h1 className="mb-6 text-2xl">What would you change next time?</h1>

          <div role="radiogroup" aria-label="What would you change next time?" className="mb-4 flex flex-col gap-2">
            {ADJUSTMENT_CHOICES.map((choice) => (
              <Button
                key={choice}
                type="button"
                role="radio"
                aria-checked={proposedAdjustment === choice}
                variant={proposedAdjustment === choice ? "default" : "outline"}
                className="h-11 justify-start"
                onClick={() => handleAdjustmentChoice(choice)}
              >
                {choice}
              </Button>
            ))}
          </div>

          {stage === "adjustment-free-text" && (
            <>
              <Textarea
                aria-label="What would you change (optional)"
                placeholder="Optional — what would you change?"
                value={adjustmentFreeText}
                onChange={(event) => setAdjustmentFreeText(event.target.value)}
                className="mb-4"
              />
              <Button
                disabled={submitting}
                onClick={() => finish(structuredResponse, proposedAdjustment, adjustmentFreeText)}
              >
                Done
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            className="mt-2 text-xs text-muted-foreground"
            disabled={submitting}
            onClick={() => finish(structuredResponse, null, "")}
          >
            Skip this question
          </Button>
        </>
      )}

      {actionError && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {actionError}
        </p>
      )}
    </main>
  );
}
