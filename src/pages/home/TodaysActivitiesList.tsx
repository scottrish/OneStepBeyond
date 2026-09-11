import { timeLabel } from "../../domain/planningDate";
import type { Activity } from "../../services/activityService";

type TodaysActivitiesListProps = {
  todaysActivities: Activity[];
};

// docs/decisions/20260912-page-complexity-reduction-proposal.md increment
// 1 — Home's "Today's activities" list, split out of HomePage.tsx.
export default function TodaysActivitiesList({ todaysActivities }: TodaysActivitiesListProps) {
  if (todaysActivities.length === 0) return null;

  return (
    <div className="mt-4">
      <h2 className="mb-2 text-sm font-semibold text-foreground">Today&rsquo;s activities</h2>
      <ul className="flex flex-col gap-1">
        {todaysActivities.map((activity) => (
          <li
            key={activity.id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2 text-sm"
          >
            <span className="text-foreground">{activity.name}</span>
            <span className="ml-auto text-muted-foreground">
              {timeLabel(activity.startTime)}–{timeLabel(activity.finishTime)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
