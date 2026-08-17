import { useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DAY_LABELS, isValidActivity } from "../domain/activityDays";
import { useActivities } from "../hooks/useActivities";

type ActivitiesPageProps = {
  user: User;
  onBack: () => void;
};

const errorBoxStyle =
  "mb-4 rounded-lg border border-destructive bg-card p-3 text-sm text-card-foreground";

function DayToggle({
  days,
  onToggle,
  ariaLabel,
}: {
  days: number[];
  onToggle: (day: number) => void;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-1">
      {DAY_LABELS.map((label, day) => {
        const on = days.includes(day);
        return (
          <Button
            key={label}
            type="button"
            variant={on ? "default" : "outline"}
            aria-pressed={on}
            onClick={() => onToggle(day)}
            className="h-8 rounded-full px-3 text-xs"
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}

function timeLabel(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const twelveHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelveHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

export default function ActivitiesPage({ user, onBack }: ActivitiesPageProps) {
  const {
    activities,
    loading,
    loadError,
    actionError,
    retry,
    addActivity,
    updateDays,
    removeActivity,
  } = useActivities(user.id);

  const [name, setName] = useState("");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState("15:30");
  const [finishTime, setFinishTime] = useState("17:00");
  const [travelToMinutes, setTravelToMinutes] = useState("15");
  const [travelFromMinutes, setTravelFromMinutes] = useState("15");

  const canSave = isValidActivity({ name, days, startTime, finishTime });

  function toggleNewActivityDay(day: number) {
    setDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort(),
    );
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;

    const succeeded = await addActivity({
      name,
      days,
      startTime,
      finishTime,
      travelToMinutes: Number(travelToMinutes) || 0,
      travelFromMinutes: Number(travelFromMinutes) || 0,
    });

    if (succeeded) setName("");
  }

  return (
    <main className="mx-auto w-full max-w-[420px] p-8">
      <Button variant="ghost" onClick={onBack} className="mb-3 -ml-3 px-3">
        ← Back
      </Button>

      <h1 className="mb-4 text-3xl">Activities</h1>

      {loadError && (
        <div role="alert" className={errorBoxStyle}>
          <p className="mb-2">Couldn&rsquo;t load your activities.</p>
          <Button onClick={retry}>Try again</Button>
        </div>
      )}

      {!loading && !loadError && activities.length === 0 && (
        <p className="mb-4 text-muted-foreground">
          No activities yet.
          <br />
          Add practice, work or anything else that takes up your afternoons.
        </p>
      )}

      {activities.length > 0 && (
        <ul className="mb-4 flex flex-col gap-3">
          {activities.map((activity) => (
            <li
              key={activity.id}
              className="rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {activity.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {timeLabel(activity.startTime)}–{timeLabel(activity.finishTime)}
                    {activity.travelToMinutes > 0 ? ` · +${activity.travelToMinutes}m there` : ""}
                    {activity.travelFromMinutes > 0
                      ? ` · +${activity.travelFromMinutes}m back`
                      : ""}
                  </p>
                </div>
                <Button
                  aria-label={`Remove ${activity.name}`}
                  variant="ghost"
                  size="icon"
                  onClick={() => removeActivity(activity.id)}
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
              <div className="mt-3">
                <DayToggle
                  ariaLabel={`Days for ${activity.name}`}
                  days={activity.days}
                  onToggle={(day) => {
                    const next = activity.days.includes(day)
                      ? activity.days.filter((d) => d !== day)
                      : [...activity.days, day].sort();
                    updateDays(activity.id, next);
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4"
      >
        <h2 className="text-sm font-semibold">Add an activity</h2>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="activity-name">What is it?</Label>
          <Input
            id="activity-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Football practice"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Which days?</Label>
          <DayToggle
            ariaLabel="Which days?"
            days={days}
            onToggle={toggleNewActivityDay}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="activity-start">Starts</Label>
            <Input
              id="activity-start"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="activity-finish">Ends</Label>
            <Input
              id="activity-finish"
              type="time"
              value={finishTime}
              onChange={(event) => setFinishTime(event.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="activity-travel-to">Travel there (minutes)</Label>
            <Input
              id="activity-travel-to"
              inputMode="numeric"
              value={travelToMinutes}
              onChange={(event) => setTravelToMinutes(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="activity-travel-from">Travel back (minutes)</Label>
            <Input
              id="activity-travel-from"
              inputMode="numeric"
              value={travelFromMinutes}
              onChange={(event) => setTravelFromMinutes(event.target.value)}
            />
          </div>
        </div>

        {actionError && (
          <p role="alert" className={errorBoxStyle}>
            {actionError}
          </p>
        )}

        <Button type="submit" disabled={!canSave}>
          Add activity
        </Button>
      </form>
    </main>
  );
}
