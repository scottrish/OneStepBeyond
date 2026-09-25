import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ErrorBanner from "../components/ErrorBanner";
import { timeLabel } from "../domain/planningDate";
import {
  MAX_WEEKEND_HOURS,
  WEEKEND_HOURS_STEP,
  stepWeekendHours,
  weekendHoursLabel,
} from "../domain/studyCapacity";
import { usePreferences } from "../hooks/usePreferences";
import type { Preferences } from "../services/preferencesService";

type PreferencesPageProps = {
  user: User;
  onBack: () => void;
};

type HourStepperProps = {
  day: string;
  hours: number;
  onChange: (hours: number) => void;
};

// A weekend day's hours budget: 0-8 in half-hour steps
// (study-hours-v2-proposal.md §1). Beyond the prototype: − and + are
// disabled at the ends, and the description is a polite live region, so
// a screen-reader user hears each change.
function HourStepper({ day, hours, onChange }: HourStepperProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{day}</p>
        <p aria-live="polite" className="text-xs text-muted-foreground">
          {weekendHoursLabel(hours)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label={`Less time on ${day}`}
          disabled={hours <= 0}
          onClick={() => onChange(stepWeekendHours(hours, -WEEKEND_HOURS_STEP))}
          className="rounded-full"
        >
          <Minus className="size-4" />
        </Button>
        <span aria-hidden="true" className="w-8 text-center text-sm font-semibold tabular-nums">
          {hours}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label={`More time on ${day}`}
          disabled={hours >= MAX_WEEKEND_HOURS}
          onClick={() => onChange(stepWeekendHours(hours, WEEKEND_HOURS_STEP))}
          className="rounded-full"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

type StudyHoursFormProps = {
  preferences: Preferences;
  onSave: (preferences: Preferences) => void;
};

// Only mounted once preferences have loaded, so the time field's local
// state can initialize from them directly. Every change saves straight
// away — there's no Save button (docs/decisions/
// 20260925-split-weekend-study-hours.md, S1).
function StudyHoursForm({ preferences, onSave }: StudyHoursFormProps) {
  // The time field keeps its own text: a half-typed time reads as "" and
  // isn't saved, but stays in the field while the student finishes it.
  const [doneBy, setDoneBy] = useState(preferences.weekdayFinishTime.slice(0, 5));

  return (
    <>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">School nights</h2>
        <div className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card px-4 py-4">
          <Label htmlFor="weekday-finish">Study should be done by</Label>
          <Input
            id="weekday-finish"
            type="time"
            value={doneBy}
            onChange={(event) => {
              setDoneBy(event.target.value);
              if (event.target.value) onSave({ ...preferences, weekdayFinishTime: event.target.value });
            }}
          />
          {doneBy && (
            <p className="text-xs text-muted-foreground">
              Planning counts study time up to {timeLabel(doneBy)}, Monday to Friday.
            </p>
          )}
        </div>
      </section>

      <section className="mt-8 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">Weekends</h2>
        <p className="text-xs text-muted-foreground">
          Weekend days are open, so choose the number of hours instead of a finish time.
        </p>
        <HourStepper
          day="Saturday"
          hours={preferences.saturdayHours}
          onChange={(saturdayHours) => onSave({ ...preferences, saturdayHours })}
        />
        <HourStepper
          day="Sunday"
          hours={preferences.sundayHours}
          onChange={(sundayHours) => onSave({ ...preferences, sundayHours })}
        />
      </section>
    </>
  );
}

// docs/features/student-preferences.md and study-hours-v2-proposal.md —
// weekday start is fixed (students aren't expected to use pre-school time
// for work), so only the "done by" time is a weekday preference; each
// weekend day is its own hours budget, not a time window.
export default function PreferencesPage({ user, onBack }: PreferencesPageProps) {
  const {
    preferences,
    loading,
    loadError,
    actionError,
    saveStatus,
    retry,
    savePreferences,
    retrySave,
  } = usePreferences(user.id);

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-3 -ml-3 px-3">
        ← Back
      </Button>

      <h1 className="mb-1 text-[clamp(1.65rem,7vw,2.1rem)] leading-tight">Study hours</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Planning uses this so a day never asks for more than you said you had.
      </p>

      {loadError && <ErrorBanner message="Couldn’t load your study hours." onRetry={retry} />}

      {!loading && !loadError && (
        <>
          <StudyHoursForm
            preferences={preferences}
            onSave={(next) => void savePreferences(next)}
          />
          {actionError ? (
            <ErrorBanner
              className="mt-6"
              message={`Couldn’t save your study hours: ${actionError}`}
              onRetry={retrySave}
            />
          ) : (
            <p className="mt-6 min-h-5 text-xs text-muted-foreground">
              {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : ""}
            </p>
          )}
        </>
      )}
    </div>
  );
}
