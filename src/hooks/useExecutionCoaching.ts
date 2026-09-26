import { useEffect, useState } from "react";
import {
  RECENT_DISMISSALS,
  chooseIntervention,
  type ExecutionStage,
  type FrictionKind,
  type Intervention,
} from "../domain/executionCoaching";
import * as coachingInteractionService from "../services/coachingInteractionService";
import type { CoachingResponse } from "../services/coachingInteractionService";

type Report = {
  assignmentId: string;
  workItemId: string | null;
  workSessionId: string | null;
  stage: ExecutionStage;
  frictionKind: FrictionKind;
};

// Today Execution's coaching record (execution-coaching-v0.1.md): picks the
// one intervention for what the student reported — steering away from one
// they've recently set aside twice — and records what they did with it.
// Recording never blocks the student: if a save fails, the intervention is
// still offered and the task carries on.
export function useExecutionCoaching(studentId: string) {
  const [recentDismissals, setRecentDismissals] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    coachingInteractionService
      .listRecentDismissals(studentId, RECENT_DISMISSALS)
      .then((ids) => {
        if (!cancelled) setRecentDismissals(ids);
      })
      .catch(() => {
        // Non-critical: without history, every kind gets its own intervention.
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  async function report(input: Report): Promise<{ interactionId: string | null; intervention: Intervention }> {
    const intervention = chooseIntervention(input.frictionKind, recentDismissals);
    try {
      const interactionId = await coachingInteractionService.recordFriction(studentId, {
        ...input,
        interventionId: intervention.id,
      });
      return { interactionId, intervention };
    } catch {
      return { interactionId: null, intervention };
    }
  }

  function resolve(
    interactionId: string | null,
    intervention: Intervention | null,
    change: { response?: CoachingResponse; actionId?: string | null; note?: string | null },
  ) {
    if (change.response === "dismissed" && intervention) {
      setRecentDismissals((prev) => [intervention.id, ...prev].slice(0, RECENT_DISMISSALS));
    }
    if (!interactionId) return;
    coachingInteractionService.resolveInteraction(interactionId, change).catch(() => {});
  }

  return { report, resolve };
}
