import { Button } from "@/components/ui/button";
import { estimateLabel } from "../../domain/executionTiming";
import type { WorkSession } from "../../services/workSessionService";

type TaskCardProps = {
  session: WorkSession;
  title: string;
  context: string | null;
  stuck: boolean;
  onStart: () => void;
  onDone: () => void;
  onNeedMoreTime: () => void;
  onStuck: () => void;
  onKeepGoing: () => void;
  onMoveToTomorrow: () => void;
};

// Today Execution's current-task card (docs/features/today-execution.md):
// Start, or Done with "Need more time" / "I'm stuck" beneath it. Shows a
// revised estimate honestly — "about 40m · first planned 30m"
// (execution-coaching-v0.1.md).
export default function TaskCard({
  session,
  title,
  context,
  stuck,
  onStart,
  onDone,
  onNeedMoreTime,
  onStuck,
  onKeepGoing,
  onMoveToTomorrow,
}: TaskCardProps) {
  return (
    <div className="mb-4 rounded-3xl border border-border bg-card p-5">
      <p className="text-lg font-medium text-foreground">{title}</p>
      {context && <p className="mt-1 text-sm text-muted-foreground">{context}</p>}
      <p className="mt-3 text-sm text-muted-foreground">{estimateLabel(session)}</p>

      {stuck ? (
        <div className="mt-4 rounded-2xl bg-accent/70 px-4 py-4">
          <p className="mb-4 text-sm leading-relaxed text-accent-foreground">
            Being stuck is information, not failure. What is the smallest piece of this you could
            still do? Or do you want to move it to tomorrow?
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1 rounded-2xl" onClick={onMoveToTomorrow}>
              Move to tomorrow
            </Button>
            <Button className="flex-1 rounded-2xl" onClick={onKeepGoing}>
              Keep going
            </Button>
          </div>
        </div>
      ) : session.status === "planned" ? (
        <Button size="lg" className="mt-4 w-full rounded-2xl" onClick={onStart}>
          Start
        </Button>
      ) : (
        <>
          <Button size="lg" className="mt-4 w-full rounded-2xl" onClick={onDone}>
            Done
          </Button>
          <div className="mt-2 flex gap-2">
            <Button variant="ghost" className="flex-1 rounded-2xl text-sm" onClick={onNeedMoreTime}>
              Need more time
            </Button>
            <Button variant="ghost" className="flex-1 rounded-2xl text-sm" onClick={onStuck}>
              I&rsquo;m stuck
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
