import { Button } from "@/components/ui/button";

type TurnedInReminderProps = {
  title: string;
  onDone: () => void;
};

// Shown once, full screen, after an assignment is marked complete by any
// path (daily-planning-and-completion-v2-proposal.md item 5). "Complete"
// here means "I'm done working on it"; turning it in at school is a
// separate fact this app doesn't track, so the student is reminded. A
// full page rather than a sheet, so it can't be swiped away unread.
export default function TurnedInReminder({ title, onDone }: TurnedInReminderProps) {
  return (
    <section aria-labelledby="turned-in-title" className="flex min-h-[60vh] flex-col justify-center py-8">
      <p className="text-sm text-muted-foreground">One last thing</p>
      <h1 id="turned-in-title" className="mt-1 text-[clamp(1.65rem,7vw,2.1rem)] leading-tight">
        Mark it turned in at school
      </h1>
      <p className="mt-4 text-base text-foreground">
        Nicely done — &ldquo;{title}&rdquo; is marked complete here. Remember to also mark it as
        turned in or complete in whatever your school uses to track assignments.
      </p>
      <Button size="lg" className="mt-8 w-full rounded-2xl" onClick={onDone} autoFocus>
        Got it
      </Button>
    </section>
  );
}
