import { BookOpen, CalendarClock, ChevronRight, Clock, LogOut, Users } from "lucide-react";
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
  // Descriptions deliberately avoid each other's titles, so every row's
  // accessible name ("{title} {description}") matches only its own title.
  const destinations = [
    {
      label: "Activities",
      description: "Practices, jobs, and clubs.",
      icon: CalendarClock,
      onSelect: onGoToActivities,
    },
    { label: "Courses", description: "Your classes, each with a color.", icon: BookOpen, onSelect: onGoToCourses },
    {
      label: "Study hours",
      description: "School-night finish time and weekend time.",
      icon: Clock,
      onSelect: onGoToPreferences,
    },
    {
      label: "Support",
      description: "Invite a parent, coach, or teacher.",
      icon: Users,
      onSelect: onGoToSupport,
    },
  ];

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-3 -ml-3 px-3">
        ← Back
      </Button>

      <h1 className="mb-4 text-[clamp(1.65rem,7vw,2.1rem)] leading-tight">Settings</h1>

      {/* docs/features/mobile-app-shell-and-touch-ergonomics-v0.1.md §4:
          scannable full-width rows, at least 64px tall, each with an icon,
          title, one-line description, and trailing chevron. The text
          column truncates safely (minmax(0,1fr)) so a long description
          never pushes the chevron off-screen. */}
      <ul className="flex flex-col gap-3">
        {destinations.map(({ label, description, icon: Icon, onSelect }) => (
          <li key={label}>
            <button
              type="button"
              onClick={onSelect}
              className="grid min-h-16 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
            >
              <Icon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">{label}</span>
                <span className="block truncate text-xs text-muted-foreground">{description}</span>
              </span>
              <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>

      <Button
        variant="ghost"
        onClick={signOut}
        className="mt-6 w-full justify-start gap-3 px-4 font-normal"
      >
        <LogOut className="size-5 text-muted-foreground" />
        Sign out
      </Button>
    </div>
  );
}
