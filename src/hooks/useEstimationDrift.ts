import { useEffect, useState } from "react";
import { estimationDrift } from "../domain/estimationDrift";
import * as workSessionService from "../services/workSessionService";

// The Estimate step's coaching signal (docs/features/daily-planning.md):
// has the student historically underestimated similar work? Non-critical
// — if the fetch fails, the coaching note simply doesn't show, so this
// deliberately has no loadError/retry surface like the other hooks.
//
// Instant screens (instant-screen-data-v0.1.md, J3): starts from the app's
// last-known sessions when there are some.
export function useEstimationDrift(studentId: string): number | null {
  const [drift, setDrift] = useState<number | null>(() => {
    const known = workSessionService.peekWorkSessionsForStudent(studentId);
    return known ? estimationDrift(known) : null;
  });

  useEffect(() => {
    let cancelled = false;

    workSessionService
      .listWorkSessionsForStudent(studentId)
      .then((sessions) => {
        if (!cancelled) setDrift(estimationDrift(sessions));
      })
      .catch(() => {
        // Non-critical signal — leave drift at null.
      });

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  return drift;
}
