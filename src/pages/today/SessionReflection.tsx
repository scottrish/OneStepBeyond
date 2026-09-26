import { Button } from "@/components/ui/button";
import ErrorBanner from "../../components/ErrorBanner";

// docs/features/today-execution.md's Reflection section — exactly three
// tap choices, no free text, always skippable. Deliberately not
// ReflectionPrompt.tsx (Work Breakdown Reflection's own component): that
// flow is multi-stage with free text and a follow-up question, which
// this increment's spec explicitly excludes ("No free text, no multi-
// question survey").
const REFLECTION_CHOICES = [
  "Shorter than I thought",
  "About right",
  "Longer than I thought",
] as const;

export default function SessionReflection({
  error,
  onAnswer,
}: {
  error: string | null;
  // null = skipped.
  onAnswer: (choice: string | null) => void;
}) {
  return (
    <div>
      <h1 className="mb-6 text-2xl">Did this take longer than you expected?</h1>
      <div
        role="radiogroup"
        aria-label="Did this take longer than you expected?"
        className="mb-4 flex flex-col gap-2"
      >
        {REFLECTION_CHOICES.map((choice) => (
          <Button
            key={choice}
            type="button"
            role="radio"
            aria-checked={false}
            variant="outline"
            className="h-11 justify-start"
            onClick={() => onAnswer(choice)}
          >
            {choice}
          </Button>
        ))}
      </div>
      <Button variant="ghost" className="text-xs text-muted-foreground" onClick={() => onAnswer(null)}>
        Skip this question
      </Button>
      {error && <ErrorBanner message={error} />}
    </div>
  );
}
