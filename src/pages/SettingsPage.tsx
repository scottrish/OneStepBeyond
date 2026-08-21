import { BookOpen, CalendarClock, Clock, LogOut, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

type SettingsPageProps = {
  onBack: () => void;
  onGoToActivities: () => void;
  onGoToCourses: () => void;
  onGoToPreferences: () => void;
  onGoToSupport: () => void;
  signOut: () => Promise<void>;
};

// No prototype screen exists for this list — the prototype's gear icon
// goes straight to Activities (it never modeled real auth or course
// management), which docs/features/home-dashboard.md's own "Deviation
// from the prototype" section already documents as the reason this
// increment needs a short list here instead. "Support" is this list's
// entry point into docs/features/supporter-invitation-feature-spec-v0.1.md
// §6's suggested "Profile / Settings → Support → Add Supporter".
export default function SettingsPage({
  onBack,
  onGoToActivities,
  onGoToCourses,
  onGoToPreferences,
  onGoToSupport,
  signOut,
}: SettingsPageProps) {
  return (
    <main className="p-8">
      <Button variant="ghost" onClick={onBack} className="mb-3 -ml-3 px-3">
        ← Back
      </Button>

      <h1 className="mb-4 text-3xl">Settings</h1>

      <ul className="flex flex-col">
        <li className="border-b border-border">
          <Button
            variant="ghost"
            onClick={onGoToActivities}
            className="h-14 w-full justify-start gap-3 px-2 font-normal"
          >
            <CalendarClock className="size-5 text-muted-foreground" />
            Activities
          </Button>
        </li>
        <li className="border-b border-border">
          <Button
            variant="ghost"
            onClick={onGoToCourses}
            className="h-14 w-full justify-start gap-3 px-2 font-normal"
          >
            <BookOpen className="size-5 text-muted-foreground" />
            Courses
          </Button>
        </li>
        <li className="border-b border-border">
          <Button
            variant="ghost"
            onClick={onGoToPreferences}
            className="h-14 w-full justify-start gap-3 px-2 font-normal"
          >
            <Clock className="size-5 text-muted-foreground" />
            Study hours
          </Button>
        </li>
        <li className="border-b border-border">
          <Button
            variant="ghost"
            onClick={onGoToSupport}
            className="h-14 w-full justify-start gap-3 px-2 font-normal"
          >
            <Users className="size-5 text-muted-foreground" />
            Support
          </Button>
        </li>
        <li>
          <Button
            variant="ghost"
            onClick={signOut}
            className="h-14 w-full justify-start gap-3 px-2 font-normal"
          >
            <LogOut className="size-5 text-muted-foreground" />
            Sign out
          </Button>
        </li>
      </ul>
    </main>
  );
}
