import { useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePreferences } from "../hooks/usePreferences";
import type { Preferences, PreferencesInput } from "../services/preferencesService";

type PreferencesPageProps = {
  user: User;
  onBack: () => void;
};

const errorBoxStyle =
  "mb-4 rounded-lg border border-destructive bg-card p-3 text-sm text-card-foreground";

type PreferencesFormProps = {
  initial: Preferences;
  actionError: string | null;
  onSave: (input: PreferencesInput) => Promise<boolean>;
};

// Split out so its local editable state can initialize directly from
// `initial` via useState's lazy initializer, which only ever runs once
// per mount — this component is deliberately only ever mounted after
// preferences have finished loading (see PreferencesPage below), so
// there's no "sync state from a prop that changes after mount" effect
// needed at all, unlike a naive version of this screen would need.
function PreferencesForm({ initial, actionError, onSave }: PreferencesFormProps) {
  const [weekdayFinishTime, setWeekdayFinishTime] = useState(initial.weekdayFinishTime);
  const [weekendHours, setWeekendHours] = useState(String(initial.weekendHours));
  const [saved, setSaved] = useState(false);

  const weekendHoursNumber = Number(weekendHours);
  const canSave =
    weekdayFinishTime.trim() !== "" &&
    weekendHours.trim() !== "" &&
    !Number.isNaN(weekendHoursNumber) &&
    weekendHoursNumber >= 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    setSaved(false);
    const succeeded = await onSave({ weekdayFinishTime, weekendHours: weekendHoursNumber });
    if (succeeded) setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="weekday-finish">Done studying by, on school nights</Label>
        <Input
          id="weekday-finish"
          type="time"
          value={weekdayFinishTime}
          onChange={(event) => {
            setWeekdayFinishTime(event.target.value);
            setSaved(false);
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="weekend-hours">Hours available on a weekend day</Label>
        <Input
          id="weekend-hours"
          inputMode="decimal"
          value={weekendHours}
          onChange={(event) => {
            setWeekendHours(event.target.value);
            setSaved(false);
          }}
        />
      </div>

      {actionError && (
        <p role="alert" className={errorBoxStyle}>
          {actionError}
        </p>
      )}

      <Button type="submit" disabled={!canSave}>
        {saved ? "Saved" : "Save"}
      </Button>
    </form>
  );
}

// docs/features/student-preferences.md — weekday start is fixed
// (students aren't expected to use pre-school time for work), so only
// finish time is a preference; weekend is a plain hours budget, not a
// time window, since students won't realistically hold to a fixed
// weekend time slot.
export default function PreferencesPage({ user, onBack }: PreferencesPageProps) {
  const { preferences, loading, loadError, actionError, retry, savePreferences } = usePreferences(
    user.id,
  );

  return (
    <main className="mx-auto w-full max-w-[420px] p-8">
      <Button variant="ghost" onClick={onBack} className="mb-3 -ml-3 px-3">
        ← Back
      </Button>

      <h1 className="mb-1 text-3xl">Study hours</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        This is what &ldquo;how much time do I have&rdquo; is based on.
      </p>

      {loadError && (
        <div role="alert" className={errorBoxStyle}>
          <p className="mb-2">Couldn&rsquo;t load your study hours.</p>
          <Button onClick={retry}>Try again</Button>
        </div>
      )}

      {!loading && !loadError && (
        <PreferencesForm initial={preferences} actionError={actionError} onSave={savePreferences} />
      )}
    </main>
  );
}
