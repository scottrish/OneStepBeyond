import { Button } from "@/components/ui/button";

type CompletionCheckProps = {
  eyebrow: string;
  title: string;
  // The step or assignment being asked about.
  subject: string;
  detail?: string;
  yesLabel: string;
  noLabel: string;
  busy?: boolean;
  onYes: () => void;
  onNo: () => void;
};

// One of Today Execution's two completion-time checks ("Is the whole task
// done?", "Is the whole assignment done?" — execution-coaching-v0.1.md).
// A full-screen step, not a sheet: each is a single decision that must be
// answered before continuing, and a sheet could be swiped past unread.
export default function CompletionCheck({
  eyebrow,
  title,
  subject,
  detail,
  yesLabel,
  noLabel,
  busy = false,
  onYes,
  onNo,
}: CompletionCheckProps) {
  return (
    <section aria-labelledby="completion-check-title">
      <p className="text-sm text-muted-foreground">{eyebrow}</p>
      <h1 id="completion-check-title" className="mt-1 text-[clamp(1.65rem,7vw,2.1rem)] leading-tight">
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{subject}</p>
      {detail && <p className="mt-2 text-sm text-muted-foreground">{detail}</p>}
      <div className="mt-6 flex flex-col gap-2">
        <Button size="lg" className="w-full justify-start rounded-2xl" disabled={busy} onClick={onYes}>
          {yesLabel}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full justify-start rounded-2xl"
          disabled={busy}
          onClick={onNo}
        >
          {noLabel}
        </Button>
      </div>
    </section>
  );
}
