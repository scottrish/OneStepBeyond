import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "../lib/errorMessage";
import * as activityService from "../services/activityService";
import type { Activity, NewActivity } from "../services/activityService";

export function useActivities(studentId: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchActivities = useCallback(() => {
    return activityService
      .listActivities(studentId)
      .then((data) => setActivities(data))
      .catch((error) => setLoadError(errorMessage(error)))
      .finally(() => setLoading(false));
  }, [studentId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  function retry() {
    setLoading(true);
    setLoadError(null);
    fetchActivities();
  }

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
