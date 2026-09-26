import { Button } from "@/components/ui/button";
import { estimateLabel } from "../../domain/executionTiming";
import type { WorkSession } from "../../services/workSessionService";

type TaskCardProps = {
  session: WorkSession;
  title: string;
  context: string | null;
  onStart: () => void;
  onDone: () => void;
  // Before starting: "I'm stuck" (the friction picker) and "Not now"
  // (straight to rescheduling). Once started: "Need more time" and
  // "I'm stuck" (execution-coaching-v0.1.md, Trigger).
  onStuck: () => void;
  onNotNow: () => void;
  onNeedMoreTime: () => void;
};

// Today Execution's current-task card (docs/features/today-execution.md):
// Start or Done stays the main, thumb-zone action, with quieter ways to say
// something's in the way beneath it. Shows a revised estimate honestly —
// "about 40m · first planned 30m" (execution-coaching-v0.1.md).
export default function TaskCard({
  session,
  title,
  context,
  onStart,
  onDone,
  onStuck,
  onNotNow,
  onNeedMoreTime,
}: TaskCardProps) {
  return (
    <div className="mb-4 rounded-3xl border border-border bg-card p-5">
      <p className="text-lg font-medium text-foreground">{title}</p>
      {context && <p className="mt-1 text-sm text-muted-foreground">{context}</p>}
      <p className="mt-3 text-sm text-muted-foreground">{estimateLabel(session)}</p>

      {session.status === "planned" ? (
        <>
          <Button size="lg" className="mt-4 w-full rounded-2xl" onClick={onStart}>
            Start
          </Button>
          <div className="mt-2 flex gap-2">
            <Button variant="ghost" className="flex-1 rounded-2xl text-sm" onClick={onStuck}>
              I&rsquo;m stuck
            </Button>
            <Button variant="ghost" className="flex-1 rounded-2xl text-sm" onClick={onNotNow}>
              Not now
            </Button>
          </div>
        </>
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
