import { useCallback, useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import { useAsyncData } from "./useAsyncData";
import * as activityService from "../services/activityService";
import type { Activity, NewActivity } from "../services/activityService";

export function useActivities(studentId: string) {
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchActivities = useCallback(
    () => activityService.listActivities(studentId),
    [studentId],
  );
  const {
    data: activities,
    setData: setActivities,
    loading,
    loadError,
    retry,
  } = useAsyncData<Activity[]>(fetchActivities, []);

  async function addActivity(input: NewActivity): Promise<boolean> {
    setActionError(null);
    try {
      const activity = await activityService.createActivity(studentId, input);
      setActivities((prev) => [...prev, activity]);
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    }
  }

  async function updateDays(id: string, days: number[]): Promise<boolean> {
    setActionError(null);
    try {
      await activityService.updateActivityDays(id, days);
      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === id ? { ...activity, days } : activity,
        ),
      );
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    }
  }

  async function removeActivity(id: string): Promise<boolean> {
    setActionError(null);
    try {
      await activityService.deleteActivity(id);
      setActivities((prev) => prev.filter((activity) => activity.id !== id));
      return true;
    } catch (error) {
      setActionError(errorMessage(error));
      return false;
    }
  }

  return {
    activities,
    loading,
    loadError,
    actionError,
    retry,
    addActivity,
    updateDays,
    removeActivity,
  };
}
