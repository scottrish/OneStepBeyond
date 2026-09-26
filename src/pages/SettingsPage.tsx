import { useState } from "react";
import { BookOpen, CalendarClock, ChevronRight, Clock, LogOut, SunMoon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResponsiveSheet from "@/components/ResponsiveSheet";
import { APPEARANCE_CHOICES, appearanceLabel } from "../domain/appearance";
import { useAppearance } from "../hooks/useAppearance";

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
  const [appearance, setAppearance] = useAppearance();
  const [choosingAppearance, setChoosingAppearance] = useState(false);

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
    // Light or dark (docs/features/appearance-light-dark-v0.1.md): a sheet,
    // not a screen — three choices. Its description is the current one.
    {
      label: "Appearance",
      description: appearanceLabel(appearance),
      icon: SunMoon,
      onSelect: () => setChoosingAppearance(true),
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

      <ResponsiveSheet open={choosingAppearance} onOpenChange={setChoosingAppearance} title="Appearance">
        {/* Native radios: arrow keys and grouping for free. A choice applies
            at once, so the student sees it; closing keeps it (no Save). */}
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Appearance</legend>
          {APPEARANCE_CHOICES.map((option) => (
            <label
              key={option.value}
              className="flex min-h-12 cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3 has-[:checked]:border-primary has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring"
            >
              <input
                type="radio"
                name="appearance"
                value={option.value}
                checked={appearance === option.value}
                onChange={() => setAppearance(option.value)}
                className="mt-0.5 size-4 shrink-0 accent-primary focus-visible:outline-none"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{option.label}</span>
                {option.hint && <span className="block text-xs text-muted-foreground">{option.hint}</span>}
              </span>
            </label>
          ))}
        </fieldset>
      </ResponsiveSheet>

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
